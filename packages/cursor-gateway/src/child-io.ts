import type { ChildProcess } from "node:child_process";
import type { ServerResponse } from "node:http";
import { chunkObject, writeSse } from "./openai";
import { mapStreamJsonEvent, parseNdjsonLine } from "./stream-map";

export function consumeNdjson(
  child: ChildProcess,
  onEvent: (event: unknown) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    let settled = false;
    const stdout = child.stdout;
    const stderr = child.stderr;
    const errChunks: Buffer[] = [];
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve();
    };
    if (stdout) {
      stdout.setEncoding("utf8");
      stdout.on("data", (chunk: string) => {
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const parsed = parseNdjsonLine(line);
          if (parsed !== undefined) onEvent(parsed);
        }
      });
    }
    if (stderr) {
      stderr.on("data", (c: Buffer | string) => {
        errChunks.push(typeof c === "string" ? Buffer.from(c) : c);
      });
    }
    child.on("error", (err) => finish(err));
    child.on("close", (code) => {
      if (buffer.trim()) {
        const parsed = parseNdjsonLine(buffer);
        if (parsed !== undefined) onEvent(parsed);
      }
      if (code && code !== 0) {
        const errText = Buffer.concat(errChunks).toString("utf8").trim();
        finish(new Error(errText || `cursor-agent exited ${code}`));
        return;
      }
      finish();
    });
  });
}

export async function collectChild(child: ChildProcess): Promise<string> {
  const deltas: string[] = [];
  let resultText = "";
  await consumeNdjson(child, (event) => {
    const mapped = mapStreamJsonEvent(event);
    if (mapped.kind === "delta") deltas.push(mapped.text);
    else if (mapped.kind === "finish") resultText = mapped.text;
  });
  if (resultText) return resultText;
  return deltas.join("");
}

export async function streamChild(
  child: ChildProcess,
  res: ServerResponse,
  meta: { id: string; created: number; model: string },
): Promise<void> {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  writeSse(res, chunkObject({ ...meta, delta: { role: "assistant" }, finish: null }));
  let sawDelta = false;
  await consumeNdjson(child, (event) => {
    const mapped = mapStreamJsonEvent(event);
    if (mapped.kind === "delta") {
      sawDelta = true;
      writeSse(res, chunkObject({ ...meta, delta: { content: mapped.text }, finish: null }));
    } else if (mapped.kind === "finish" && !sawDelta && mapped.text) {
      writeSse(res, chunkObject({ ...meta, delta: { content: mapped.text }, finish: null }));
    }
  });
  writeSse(res, chunkObject({ ...meta, delta: {}, finish: "stop" }));
  res.write("data: [DONE]\n\n");
  res.end();
}
