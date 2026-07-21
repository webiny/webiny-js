import React from "react";
import nodePath from "node:path";
import { z } from "zod";
import { defineExtension, BuildParam } from "@webiny/project/extensions/index.js";

/**
 * Configure the self-hosted (server) hosting type's local file storage (uploaded files) + upload secret.
 *
 * Emitted as the API build parameters `WEBINY_LOCAL_STORAGE_PATH` (the on-disk directory uploaded
 * files are written to and served from) and `WEBINY_UPLOAD_SECRET` (used to sign upload tokens),
 * which `FileManagerServerConfig` reads via `BuildParams`. Note this uses `BuildParam` (DI build
 * params), NOT `EnvVar` like `Infra.Sqlite` — the SQLite connection reads `process.env` directly,
 * whereas the file-manager server config resolves these through `BuildParams.get(...)`, so they must
 * be registered as build params (same channel as `Infra.Crypto.Encryption`).
 *
 * A relative storage path is resolved against the project root (not the disposable app workspace), so
 * uploaded files survive rebuilds — same rule as `Infra.Sqlite`.
 *
 * AWS hosting-type counterpart concept: the S3 bucket (`ApiFileManager`).
 */
export const FileStorage = defineExtension({
    type: "Infra/FileStorage",
    tags: { runtimeContext: "project" },
    description:
        "Configure the server hosting type's local file storage directory and upload secret.",
    paramsSchema: z.object({
        path: z
            .string()
            .describe(
                "Path to the local file storage directory (absolute, or relative to the project root)."
            ),
        uploadSecret: z.string().describe("Secret string used to sign file upload tokens.")
    }),
    render({ path: storagePathParam, uploadSecret }) {
        const storagePath = nodePath.isAbsolute(storagePathParam)
            ? storagePathParam
            : nodePath.join(process.cwd(), storagePathParam);

        return (
            <>
                <BuildParam paramName="WEBINY_LOCAL_STORAGE_PATH" value={storagePath} />
                <BuildParam paramName="WEBINY_UPLOAD_SECRET" value={uploadSecret} />
            </>
        );
    }
});
