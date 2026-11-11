import React from "react";
import path from "node:path";
import { z } from "zod";
import { defineExtension, EnvVar } from "@webiny/project/extensions/index.js";

/** Where the search for a free port starts when no `port` is configured. */
export const PGLITE_DEFAULT_PORT = 54320;
export const PGLITE_DEFAULT_DATA_DIR = "./.webiny/postgres";

const paramsSchema = z.object({
    dataDir: z
        .string()
        .optional()
        .describe(
            `Folder the database is kept in (absolute, or relative to the project root). Defaults to "${PGLITE_DEFAULT_DATA_DIR}".`
        ),
    port: z
        .number()
        .optional()
        .describe(
            `Local port the database listens on. When omitted, the first free port from ${PGLITE_DEFAULT_PORT} is used, picked each time \`watch\` / \`serve\` start. A configured port is used as is, and startup fails if it is busy.`
        )
});

export type PgliteParams = z.infer<typeof paramsSchema>;

export interface ResolvedPglite {
    /** The configured port, or null: a free one is picked when the database starts. */
    port: number | null;
    /** Absolute: a relative `dataDir` is resolved against the project root. */
    dataDir: string;
}

/** The params with defaults applied and the data folder made absolute (against the project root). */
export const resolvePglite = (params: PgliteParams): ResolvedPglite => {
    const dataDir = params.dataDir ?? PGLITE_DEFAULT_DATA_DIR;
    return {
        port: params.port ?? null,
        dataDir: path.isAbsolute(dataDir) ? dataDir : path.join(process.cwd(), dataDir)
    };
};

/**
 * A Postgres database for local development, with nothing to install: `webiny watch` and
 * `webiny-standalone serve` start it next to the api (PGlite, Postgres compiled to WebAssembly,
 * kept in `dataDir` so data survives restarts). Content uses the Postgres-native storage.
 *
 * The api connects to it like to any Postgres server, through the same `WEBINY_PG_*` settings
 * `<Infra.Postgres>` emits, so moving to a real server is a change of extension, not of code. It
 * serves one connection at a time, so the api's pool is limited to one. For production, use
 * `<Infra.Postgres>`.
 *
 * The port is only known once the database starts (unless configured), so WEBINY_PG_PORT is set then,
 * by `watch` / `serve`, before the api starts, rather than here.
 */
export const Pglite = defineExtension({
    type: "Infra/Pglite",
    tags: { runtimeContext: "project" },
    description:
        "Run a PGlite database (Postgres compiled to WebAssembly) for the standalone hosting type.",
    paramsSchema,
    render: props => {
        const { dataDir } = resolvePglite(props);
        return (
            <>
                <EnvVar varName="WEBINY_PG_HOST" value="127.0.0.1" />
                {/* PGlite accepts any credentials; the connection factory requires them to be set. */}
                <EnvVar varName="WEBINY_PG_USER" value="postgres" />
                <EnvVar varName="WEBINY_PG_PASSWORD" value="postgres" />
                <EnvVar varName="WEBINY_PG_DATABASE" value="postgres" />
                <EnvVar varName="WEBINY_PG_POOL_MAX" value="1" />
                <EnvVar varName="WEBINY_PGLITE_DATA_DIR" value={dataDir} />
            </>
        );
    }
});
