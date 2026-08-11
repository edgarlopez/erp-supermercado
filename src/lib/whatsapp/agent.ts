import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { TOOL_DEFINITIONS, executeTool } from "./tools";

const client = new Anthropic();

const SYSTEM_PROMPT = `Eres el asistente de WhatsApp del dueno de un supermercado de barrio.
Respondes en espanol, de forma breve y directa (esto es un mensaje de WhatsApp, no un reporte).
Usa siempre las herramientas disponibles para consultar datos reales del negocio (ventas, inventario,
finanzas) antes de responder. Nunca inventes cifras. Si una herramienta no tiene datos para lo
preguntado, dilo claramente en vez de adivinar. Incluye montos en pesos con el simbolo $.`;

export interface ConversationContext {
  lastQuestion: string | null;
  lastAnswer: string | null;
}

export async function answerQuestion(question: string, previous: ConversationContext | null): Promise<string> {
  let userText = question;
  if (previous?.lastQuestion && previous?.lastAnswer) {
    userText = `(Contexto: la pregunta anterior fue "${previous.lastQuestion}" y respondiste "${previous.lastAnswer}")\n\n${question}`;
  }

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userText }];

  for (let i = 0; i < 4; i++) {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      tools: TOOL_DEFINITIONS,
      messages,
    });

    if (response.stop_reason !== "tool_use") {
      const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
      return textBlock?.text ?? "No pude generar una respuesta.";
    }

    messages.push({ role: "assistant", content: response.content });

    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUses) {
      try {
        const result = await executeTool(toolUse.name, toolUse.input as Record<string, unknown>);
        toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(result) });
      } catch (error) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: error instanceof Error ? error.message : "Error desconocido",
          is_error: true,
        });
      }
    }

    messages.push({ role: "user", content: toolResults });
  }

  return "No pude completar la consulta, intenta de nuevo en un momento.";
}
