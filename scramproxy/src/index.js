import { createServer } from "node:http";
import { fileURLToPath } from "url";
import { hostname } from "node:os";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

// File paths
const publicPath = fileURLToPath(new URL("../public/", import.meta.url));
const siteRoot = fileURLToPath(new URL("../../", import.meta.url));

logging.set_level(logging.NONE);
Object.assign(wisp.options, {
  allow_udp_streams: false,
  hostname_blacklist: [/example\.com/],
  dns_servers: ["1.1.1.3", "1.0.0.3"],
});

// Create Fastify server
const fastify = Fastify({
  serverFactory: (handler) => {
    return createServer()
      .on("request", (req, res) => {
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        handler(req, res);
      })
      .on("upgrade", (req, socket, head) => {
        if (req.url.endsWith("/wisp/")) wisp.routeRequest(req, socket, head);
        else socket.end();
      });
  },
});

// =======================
// STATIC FILES
// =======================

// 1️⃣ Your website at root (/)
fastify.register(fastifyStatic, {
  root: siteRoot,
  decorateReply: true,
});

// 2️⃣ Scramjet frontend (/scramjet/)
fastify.register(fastifyStatic, {
  root: publicPath,
  prefix: "/scramjet/",
  decorateReply: true, // needed for sendFile
});

// 3️⃣ Catch-all for dynamic URLs under /scramjet/* to prevent 404
fastify.get("/scramjet/*", (req, reply) => {
  return reply.sendFile("index.html", publicPath);
});

// 4️⃣ Scramjet internals (/scram/)
fastify.register(fastifyStatic, {
  root: scramjetPath,
  prefix: "/scram/",
  decorateReply: false,
});

// 5️⃣ libcurl (/libcurl/)
fastify.register(fastifyStatic, {
  root: libcurlPath,
  prefix: "/libcurl/",
  decorateReply: false,
});

// 6️⃣ baremux (/baremux/)
fastify.register(fastifyStatic, {
  root: baremuxPath,
  prefix: "/baremux/",
  decorateReply: false,
});

// =======================
// 404 HANDLER
// =======================
fastify.setNotFoundHandler((req, reply) => {
  reply
    .code(404)
    .type("text/html")
    .send("<h1>404 Not Found</h1>");
});

// =======================
// SERVER START
// =======================
fastify.server.on("listening", () => {
  const address = fastify.server.address();
  console.log("Listening on:");
  console.log(`  http://localhost:${address.port}`);
  console.log(`  http://${hostname()}:${address.port}`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
function shutdown() {
  console.log("Shutting down server");
  fastify.close();
  process.exit(0);
}

let port = parseInt(process.env.PORT || "", 10);
if (isNaN(port)) port = 8080;

fastify.listen({
  port,
  host: "0.0.0.0",
});
