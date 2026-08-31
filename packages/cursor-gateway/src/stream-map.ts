export type MappedEvent =
  | { kind: "delta"; text: string }
  | { kind: "finish"; text: string }
  | { kind: "ignore" };

function textFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const part of content) {
    if (typeof part === "string") parts.push(part);
    else if (part && typeof part === "object" && "text" in part) {
      const text = (part as { text: unknown }).text;
      if (typeof text === "string") parts.push(text);
    }
  }
  return parts.join("");
}

function textFromMessage(message: unknown): string {
  if (typeof message === "string") return message;
  if (!message || typeof message !== "object") return "";
  const rec = message as { content?: unknown; text?: unknown };
  const fromContent = textFromContent(rec.content);
  if (fromContent) return fromContent;
  return typeof rec.text === "string" ? rec.text : "";
}

export function shouldSkipDuplicateAssistant(
  event: Record<string, unknown>,
): boolean {
  const hasTs = event.timestamp_ms != null;
  const hasCall = event.model_call_id != null;
  return hasTs && hasCall;
}

export function extractAnyAssistantText(event: Record<string, unknown>): string {
  const fromMessage = textFromMessage(event.message);
  if (fromMessage) return fromMessage;
  if (typeof event.text === "string") return event.text;
  const fromContent = textFromContent(event.content);
  if (fromContent) return fromContent;
  return "";
}

export function mapStreamJsonEvent(raw: unknown): MappedEvent {
  if (!raw || typeof raw !== "object") return { kind: "ignore" };
  const event = raw as Record<string, unknown>;
  const type = event.type;

  if (type === "system" || type === "user" || type === "tool_call") {
    return { kind: "ignore" };
  }

  if (type === "assistant") {
    if (shouldSkipDuplicateAssistant(event)) return { kind: "ignore" };
    const text = extractAnyAssistantText(event);
    return text ? { kind: "delta", text } : { kind: "ignore" };
  }

  if (type === "result") {
    return {
      kind: "finish",
      text: typeof event.result === "string" ? event.result : "",
    };
  }

  const text = extractAnyAssistantText(event);
  if (text) return { kind: "delta", text };
  return { kind: "ignore" };
}

export function parseNdjsonLine(line: string): unknown | undefined {
  const trimmed = line.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return undefined;
  }
}
