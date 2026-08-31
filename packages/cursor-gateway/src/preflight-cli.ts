import { pathToFileURL } from "node:url";
import { loadConfig } from "./config";
import { preflightWrap, type Preflight } from "./preflight";

export type PreflightFn = typeof preflightWrap;

export async function runPreflightCli(input: {
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  preflight?: PreflightFn;
  write?: (line: string) => void;
}): Promise<number> {
  const config = loadConfig(input.env ?? process.env, input.cwd ?? process.cwd());
  const run = input.preflight ?? preflightWrap;
  const write = input.write ?? ((line) => {
    process.stdout.write(`${line}\n`);
  });
  const result: Preflight = await run({
    host: config.host,
    port: config.port,
    expectedWorkspace: config.workspace,
  });
  write(JSON.stringify(result));
  return result.ok ? 0 : 1;
}

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entry) {
  process.exit(await runPreflightCli({}));
}
