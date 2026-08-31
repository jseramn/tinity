import http from "node:http";

export const PREFLIGHT_TIMEOUT_MS = 2000;

export type HealthBody = {
  ok?: unknown;
  version?: unknown;
  busy?: unknown;
  workspace?: unknown;
  model?: unknown;
};

export type ModelsBody = {
  object?: unknown;
  data?: unknown;
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

export function normalizeWorkspace(path: string): string {
  const trimmed = path.trim();
  if (trimmed === "" || trimmed === "/") return trimmed;
  return trimmed.replace(/\/+$/, "");
}

export function isFastModel(model: string): boolean {
  if (/fast\s*=\s*true/i.test(model)) return true;
  return !/fast\s*=\s*false/i.test(model);
}

export function inspectHealth(body: HealthBody, expectedWorkspace: string): Preflight {
  if (body.ok !== true) return { ok: false, reason: "health-stale" };
  if (typeof body.workspace !== "string" || typeof body.model !== "string") {
    return { ok: false, reason: "health-stale" };
  }
  const workspace = normalizeWorkspace(body.workspace);
  const model = body.model.trim();
  if (workspace.length === 0 || model.length === 0) {
    return { ok: false, reason: "health-stale" };
  }
  if (isFastModel(model)) return { ok: false, reason: "fast-model" };
  if (body.busy === true) return { ok: false, reason: "busy" };
  const expected = normalizeWorkspace(expectedWorkspace);
  if (expected.length === 0 || workspace !== expected) {
    return { ok: false, reason: "workspace-mismatch" };
  }
  return { ok: true, workspace, model };
}

export function inspectModelsList(
  body: ModelsBody,
  expectedModel: string,
): PreflightErr | { ok: true } {
  if (body.object !== "list" || !Array.isArray(body.data) || body.data.length === 0) {
    return { ok: false, reason: "health-stale" };
  }
  const first = body.data[0];
  if (!first || typeof first !== "object") return { ok: false, reason: "health-stale" };
  const id = (first as { id?: unknown }).id;
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, reason: "health-stale" };
  }
  if (isFastModel(id)) return { ok: false, reason: "fast-model" };
  if (id !== expectedModel) return { ok: false, reason: "health-stale" };
  return { ok: true };
}

export async function preflightWrap(input: {
  port: number;
  expectedWorkspace: string;
  host?: string;
}): Promise<Preflight> {
  const host = input.host ?? "127.0.0.1";
  let healthRes: { status: number; text: string };
  try {
    healthRes = await getPath(host, input.port, "/health");
  } catch {
    return { ok: false, reason: "unreachable" };
  }
  if (healthRes.status !== 200) return { ok: false, reason: "health-stale" };
  let healthBody: HealthBody;
  try {
    healthBody = JSON.parse(healthRes.text) as HealthBody;
  } catch {
    return { ok: false, reason: "health-stale" };
  }
  const health = inspectHealth(healthBody, input.expectedWorkspace);
  if (!health.ok) return health;

  let modelsRes: { status: number; text: string };
  try {
    modelsRes = await getPath(host, input.port, "/v1/models");
  } catch {
    return { ok: false, reason: "health-stale" };
  }
  if (modelsRes.status !== 200) return { ok: false, reason: "health-stale" };
  let modelsBody: ModelsBody;
  try {
    modelsBody = JSON.parse(modelsRes.text) as ModelsBody;
  } catch {
    return { ok: false, reason: "health-stale" };
  }
  const models = inspectModelsList(modelsBody, health.model);
  if (!models.ok) return models;
  return health;
}

function getPath(host: string, port: number, path: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host, port, path, method: "GET" }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () =>
        resolve({
          status: res.statusCode ?? 0,
          text: Buffer.concat(chunks).toString("utf8"),
        }),
      );
    });
    req.setTimeout(PREFLIGHT_TIMEOUT_MS, () => {
      req.destroy(new Error("timeout"));
    });
    req.on("error", reject);
    req.end();
  });
}
