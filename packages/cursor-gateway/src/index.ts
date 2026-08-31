import { loadConfig } from "./config";
import { createGatewayServer, listenLocal } from "./server";

const config = loadConfig();
const server = createGatewayServer({ config });
await listenLocal(server, config);
const addr = server.address();
const port = typeof addr === "object" && addr ? addr.port : config.port;
console.log(`cursor-gateway listening on http://${config.host}:${port}`);
