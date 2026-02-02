import { createServer } from "node:http";
import { fileURLToPath } from "url";
import { hostname } from "node:os";

import Fastify from "fastify";
import fastifyStatic from "@fastify/static";

import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

// Paths
const siteRoot = fileURLToPath(new URL("../../", import.meta.url));
const publicPath = fileURLToPath(new URL("../public/", import.meta.url));

// Wisp config
logging.set_level(logging.NONE);
Object.assign(wisp.options, {
  allow_udp_streams: false,
  hostname_blacklist: [/example\.com/],
  dns_servers: ["1.1.1.3", "1.0.0.3"],
});

// Fastify server
const fastify = Fastify({
  serverFactory: (handler) => {
    return createServer()
      .on("request", (req, res) => {
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        handler(req, res);
      })
      .on("upgrade", (req, socket, head) => {
        if (req.url.endsWith("/wisp/")) {
          wisp.routeRequest(req, socket, head);
        } else {
          socket.end();
        }
      });
  },
});

//
// ===== STATIC FILES =====
//

// 🔹 YOUR WEBSITE ( / )
fastify.register(fastifyStatic, {
  root: siteRoot,
  decorateReply: true,
});

// 🔹 Scramjet UI ( /scramjet/ )
fastify.register(fastifyStatic, {
  root: publicPath,
  prefix: "/scramjet/",
  decorateReply: false,
});

// 🔹 Scramjet internals ( REQUIRED )
fastify.register(fastifyStatic, {
  root: scramjetPath,
  prefix: "/scram/",
  decorateReply: false,
});

// 🔹 libcurl
fastify.register(fastifyStatic, {
  root: libcurlPath,
  prefix: "/libcurl/",
  decorateReply: false,
});

// 🔹 baremux
fastify.register(fastifyStatic, {
  root: baremuxPath,
  prefix: "/baremux/",
  decorateReply: false,
});

//
// ===== 404 HANDLER (NO sendFile) =====
//
fastify.setNotFoundHandler((req, reply) => {
  reply
    .code(404)
    .type("text/html")
    .send("<h1>404 Not Found</h1>");
});

//
// ===== START SERVER =====
//
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
