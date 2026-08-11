import { NextRequest, NextResponse, after } from "next/server";
import twilio from "twilio";
import { getDataSource } from "@/lib/db/data-source";
import { WhatsappConversation } from "@/lib/db/entities/WhatsappConversation";
import { answerQuestion } from "@/lib/whatsapp/agent";

const TWIML_EMPTY = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });

  const signature = request.headers.get("x-twilio-signature") ?? "";
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/whatsapp/webhook`;
  const valid = twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN!, signature, url, params);

  if (!valid) {
    return new NextResponse("Firma invalida", { status: 403 });
  }

  const from = params.From;
  const body = params.Body?.trim();
  const ownerNumbers = (process.env.WHATSAPP_OWNER_NUMBERS ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  if (!from || !body || !ownerNumbers.includes(from)) {
    return new NextResponse(TWIML_EMPTY, { status: 200, headers: { "Content-Type": "text/xml" } });
  }

  // Twilio da ~10-15s antes de considerar el webhook fallido; Claude + la consulta
  // a la base de datos pueden tardar mas, asi que respondemos vacio de inmediato y
  // mandamos la respuesta real por la API REST de Twilio despues.
  after(async () => {
    try {
      const db = await getDataSource();
      const repo = db.getRepository(WhatsappConversation);
      const existing = await repo.findOneBy({ fromNumber: from });
      const isRecent = existing && Date.now() - new Date(existing.updatedAt).getTime() < 10 * 60 * 1000;

      const answer = await answerQuestion(
        body,
        isRecent ? { lastQuestion: existing!.lastQuestion, lastAnswer: existing!.lastAnswer } : null,
      );

      await repo.upsert({ fromNumber: from, lastQuestion: body, lastAnswer: answer, updatedAt: new Date() }, ["fromNumber"]);

      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: from,
        body: answer.slice(0, 1500),
      });
    } catch (error) {
      console.error("Error procesando mensaje de WhatsApp:", error);
    }
  });

  return new NextResponse(TWIML_EMPTY, { status: 200, headers: { "Content-Type": "text/xml" } });
}
