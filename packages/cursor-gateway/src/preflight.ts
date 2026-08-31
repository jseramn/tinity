import http from "node:http";

export type HealthBody = {
  ok?: unknown;
  version?: unknown;
  busy?: unknown;
  workspace?: unknown;
  model?: unknown;
};

export type PreflightOk = {
  ok: true;
  workspace: string;
  model: string;
};

export type PreflightErr = {
  ok: false;
  reason: "busy" | "workspace-mismatch" | "health-stale" | "unreachable" | "fast-model";
};

export type Preflight = PreflightOk | PreflightErr;

export function inspectHealth(body: HealthBody, expectedWorkspace: string): Preflight {
  if (body.ok !== true) return { ok: false, reason: "health-stale" };
  if (typeof body.workspace !== "string" || body.workspace.length === 0) {
    return { ok: false, reason: "health-stale" };
  }
  if (typeof body.model !== "string" || body.model.length === 0) {
    return { ok: false, reason: "health-stale" };
  }
  if (/fast\s*=\s*true/i.test(body.model)) return { ok: false, reason: "fast-model" };
  if (body.busy === true) return { ok: false, reason: "busy" };
  if (body.workspace !== expectedWorkspace) return { ok: false, reason: "workspace-mismatch" };
  return { ok: true, workspace: body.workspace, model: body.model };
}

export async function preflightWrap(input: {
  port: number;
  expectedWorkspace: string;
  host?: string;
}): Promise<Preflight> {
  const host = input.host ?? "127.0.0.1";
  let raw: string;
  try {
    raw = await getHealth(host, input.port);
  } catch {
    return { ok: false, reason: "unreachable" };
  }
  let body: HealthBody;
  try {
    body = JSON.parse(raw) as HealthBody;
  } catch {
    return { ok: false, reason: "health-stale" };
  }
  return inspectHealth(body, input.expectedWorkspace);
}

function getHealth(host: string, port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host, port, path: "/health", method: "GET" },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      },
    );
    req.on("error", reject);
    req.end();
  });
}
