import React from "react";
import nodePath from "node:path";
import { z } from "zod";
import { defineExtension } from "@webiny/project/extensions/index.js";
import { EnvVar } from "@webiny/project/extensions/index.js";

/**
 * Configure the standalone hosting type's local file storage (uploaded files) + upload secret.
 *
 * Sets the `WEBINY_LOCAL_STORAGE_PATH` (the on-disk directory uploaded files are written to and
 * served from) and `WEBINY_UPLOAD_SECRET` (signs upload tokens) env vars for `webiny watch` and
 * `webiny serve`, which pass them to the API server. The API reads them at startup
 * (`readStandaloneConfig`) and refuses to start without them. Nothing is baked into the build: a
 * deployed container sets both itself.
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
        "Configure the standalone hosting type's local file storage directory and upload secret.",
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
                <EnvVar varName="WEBINY_LOCAL_STORAGE_PATH" value={storagePath} />
                <EnvVar varName="WEBINY_UPLOAD_SECRET" value={uploadSecret} />
            </>
        );
    }
});
