import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "whatsapp_conversations" })
export class WhatsappConversation {
  @PrimaryColumn({ name: "from_number" })
  fromNumber!: string;

  @Column({ name: "last_question", nullable: true })
  lastQuestion!: string | null;

  @Column({ name: "last_answer", nullable: true })
  lastAnswer!: string | null;

  @Column({ name: "updated_at" })
  updatedAt!: Date;
}
