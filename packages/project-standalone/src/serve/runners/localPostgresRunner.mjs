/*
 * Spawned by `spawnLocalPostgres`: the database `<Infra.LocalPostgres>` gives the api. PGlite
 * (Postgres compiled to WebAssembly) keeps its data in WEBINY_LOCAL_PG_DATA_DIR and is served over
 * the Postgres wire protocol on 127.0.0.1:WEBINY_PG_PORT, so the api connects to it like to any
 * Postgres server. One connection at a time: the api's pool is limited to one (WEBINY_PG_POOL_MAX).
 *
 * Runs from project-standalone's own build, like `devProxyRunner`: it belongs to no app workspace.
 */
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const dataDir = process.env.WEBINY_LOCAL_PG_DATA_DIR;
const port = Number(process.env.WEBINY_PG_PORT);

if (!dataDir || !port) {
  console.error(
    "WEBINY_LOCAL_PG_DATA_DIR and WEBINY_PG_PORT must be set (by <Infra.LocalPostgres>)."
  );
  process.exit(1);
}

fs.mkdirSync(dataDir, { recursive: true });

const db = await PGlite.create(dataDir);
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1" });

try {
  await server.start();
} catch (error) {
  console.error(
    `Could not start the local Postgres on 127.0.0.1:${port}: ${error.message}. ` +
      "Is another process using the port? Set a different one with <Infra.LocalPostgres port={...} />."
  );
  await db.close();
  process.exit(1);
}

console.log(`Local Postgres (PGlite) listening on 127.0.0.1:${port}, data in ${dataDir}`);
// The api waits for this before it starts.
process.send?.("ready");

// Close cleanly, so everything written reaches the data folder.
let stopping = false;
const shutdown = async () => {
  if (stopping) {
    return;
  }
  stopping = true;
  try {
    await server.stop();
    await db.close();
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGHUP", shutdown);
