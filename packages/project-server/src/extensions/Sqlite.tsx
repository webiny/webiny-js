import React from "react";
import path from "node:path";
import { z } from "zod";
import { defineExtension, EnvVar } from "@webiny/project/extensions/index.js";

/**
 * Configure the self-hosted (server) hosting type's SQLite database file.
 *
 * Baked into the api runtime as `WEBINY_SQL_FILENAME`, which the api handler reads for its Knex
 * connection. A relative path is resolved against the project root (not the disposable app
 * workspace), so the DB survives rebuilds. When omitted, the api server defaults to
 * `<projectRoot>/.webiny/server.sqlite`.
 *
 * AWS hosting-type counterpart concept: `Infra.OpenSearch` / `DatabaseSetup`. Future SQL engines
 * (Postgres, MySQL) would be sibling `Infra.*` extensions.
 */
export const Sqlite = defineExtension({
    type: "Infra/Sqlite",
    tags: { runtimeContext: "project" },
    description: "Configure the server hosting type's SQLite database file.",
    paramsSchema: z.object({
        filename: z
            .string()
            .describe(
                "Path to the SQLite database file (absolute, or relative to the project root)."
            )
    }),
    render: props => {
        const filename = path.isAbsolute(props.filename)
            ? props.filename
            : path.join(process.cwd(), props.filename);

        return <EnvVar varName="WEBINY_SQL_FILENAME" value={filename} />;
    }
});
