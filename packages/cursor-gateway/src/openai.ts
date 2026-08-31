import type { ServerResponse } from "node:http";

export function completionObject(input: {
  id: string;
  created: number;
  model: string;
  text: string;
}) {
  return {
    id: input.id,
    object: "chat.completion",
    created: input.created,
    model: input.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: input.text },
        finish_reason: "stop",
      },
    ],
  };
}

export function chunkObject(input: {
  id: string;
  created: number;
  model: string;
  delta: Record<string, string>;
  finish: string | null;
}) {
  return {
    id: input.id,
    object: "chat.completion.chunk",
    created: input.created,
    model: input.model,
    choices: [{ index: 0, delta: input.delta, finish_reason: input.finish }],
  };
}

export function writeSse(res: ServerResponse, data: unknown): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}
