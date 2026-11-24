import React from "react";
import nodePath from "node:path";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { EnvVar } from "@webiny/project/extensions/EnvVar.js";
import { DiskStorage } from "@webiny/api-object-storage-disk/project.js";

/**
 * `<Infra.FileStorage.Disk />`: keeps a standalone project's uploaded files in a folder on disk.
 *
 * Adds the disk storage (`DiskStorage` from `@webiny/api-object-storage-disk`), which sets
 * `WEBINY_LOCAL_STORAGE_PATH`, the folder uploaded files are written to and served from, and sets
 * `WEBINY_UPLOAD_SECRET` (signs upload tokens) for `webiny watch` and `webiny serve`. Nothing is
 * baked into the build: a deployed container sets both itself, and the API refuses to start without
 * them.
 *
 * A folder only works when every API process runs on one machine; use `<Infra.FileStorage.S3 />`
 * otherwise.
 *
 * A relative storage path is resolved against the project root (not the disposable app workspace), so
 * uploaded files survive rebuilds — same rule as `Infra.Sqlite`.
 *
 * AWS hosting-type counterpart concept: the S3 bucket (`ApiFileManager`).
 */
export const DiskFileStorage = defineExtension({
    type: "Infra/FileStorage/Disk",
    tags: { runtimeContext: "project", hosting: "standalone" },
    description: "Keep the standalone hosting type's uploaded files in a folder on disk.",
    paramsSchema: z.object({
        path: z
            .string()
            .describe(
                "Path to the local file storage directory (absolute, or relative to the project root)."
            ),
        uploadSecret: z.string().describe("Secret string used to sign file upload tokens.")
    }),
    render({ path: storagePathParam, uploadSecret }) {
        let storagePath = storagePathParam;
        if (!nodePath.isAbsolute(storagePathParam)) {
            const projectRoot = process.cwd();
            storagePath = nodePath.join(projectRoot, storagePathParam);
        }

        return (
            <>
                <DiskStorage path={storagePath} />
                <EnvVar varName="WEBINY_UPLOAD_SECRET" value={uploadSecret} />
            </>
        );
    }
});
