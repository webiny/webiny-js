import { spawn } from "node:child_process";
import path from "node:path";
import { type IServerProcessSpec } from "@webiny/project/features/Watch/watchers/ServersWatcher.js";
import { stopWithParent } from "./stopWithParent.js";
import { findFreePort } from "./findFreePort.js";
import {
    LOCAL_POSTGRES_DEFAULT_PORT,
    type ResolvedLocalPostgres
} from "../extensions/LocalPostgres.js";

/**
 * The port the database listens on: the configured one as is (a busy one fails at startup, with a
 * message saying so), else the first free one from the default. Checked on 127.0.0.1, where the
 * database binds, as well as on the wildcard address.
 */
export const pickLocalPostgresPort = async (local: ResolvedLocalPostgres): Promise<number> => {
    if (local.port !== null) {
        return local.port;
    }
    return findFreePort(LOCAL_POSTGRES_DEFAULT_PORT, ["127.0.0.1", "0.0.0.0"]);
};

export interface LocalPostgresProcess {
    /** The database process, named `db` in the server output. */
    spec: IServerProcessSpec;
    /** Resolves once the database accepts connections; the api waits for it before it starts. */
    ready: Promise<void>;
}

/**
 * The local database `<Infra.LocalPostgres>` configures, as one more server process next to the
 * api (and the proxy). It is a process of its own, so rebuilding the api, which restarts the api
 * process, leaves the database running.
 *
 * The port is picked when the process starts and put in the environment (WEBINY_PG_PORT), where the
 * runner reads it, and so does the api: it is spawned after the database is ready, with the
 * environment as it is then. Once picked, it stays for the session, so `node --watch` restarts of the
 * api keep connecting to the same database.
 */
export const createLocalPostgresProcess = (local: ResolvedLocalPostgres): LocalPostgresProcess => {
    let markReady: () => void = () => undefined;
    let markFailed: (error: Error) => void = () => undefined;
    const ready = new Promise<void>((resolve, reject) => {
        markReady = resolve;
        markFailed = reject;
    });
    // Nothing may be waiting (e.g. the api is not served); the exit is reported by the process run.
    ready.catch(() => undefined);

    const spec: IServerProcessSpec = {
        name: "db",
        spawn: async () => {
            process.env.WEBINY_PG_PORT = String(await pickLocalPostgresPort(local));
            process.env.WEBINY_LOCAL_PG_DATA_DIR = local.dataDir;

            const runnerPath = path.join(import.meta.dirname, "runners", "localPostgresRunner.mjs");
            const child = spawn(process.execPath, [runnerPath], {
                // Piped so the caller can prefix + render the output; IPC carries the ready signal.
                stdio: ["ignore", "pipe", "pipe", "ipc"],
                env: process.env
            });

            child.on("message", message => {
                if (message === "ready") {
                    markReady();
                }
            });
            child.on("exit", code => {
                markFailed(new Error(`The local Postgres stopped (exit code ${code}).`));
            });

            stopWithParent(child);

            return child;
        }
    };

    return { spec, ready };
};
