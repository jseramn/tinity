export type ChatMessage = {
  role: string;
  content: unknown;
};

function partText(part: unknown): string {
  if (typeof part === "string") return part;
  if (part && typeof part === "object" && "text" in part) {
    const text = (part as { text: unknown }).text;
    return typeof text === "string" ? text : "";
  }
  return "";
}

export function messageText(message: ChatMessage): string {
  const { content } = message;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(partText).join("");
  if (content == null) return "";
  return String(content);
}

export function assemblePrompt(messages: ChatMessage[]): string {
  const systemParts = messages
    .filter((m) => m.role === "system")
    .map(messageText)
    .filter((t) => t.length > 0);
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUser ? messageText(lastUser) : "";
  if (systemParts.length === 0) return userText;
  return `System:\n${systemParts.join("\n\n")}\n\nUser:\n${userText}`;
}
