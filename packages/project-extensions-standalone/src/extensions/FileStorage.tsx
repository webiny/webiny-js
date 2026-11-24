import React from "react";
import nodePath from "node:path";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { EnvVar } from "@webiny/project/extensions/EnvVar.js";
import { DiskStorage } from "@webiny/api-object-storage-disk/project.js";

/**
 * Configure the standalone hosting type's local file storage (uploaded files) + upload secret.
 *
 * Sets `WEBINY_UPLOAD_SECRET` (signs upload tokens) for `webiny watch` and `webiny serve`. With
 * `path`, it also adds the disk storage (`DiskStorage` from `@webiny/api-object-storage-disk`),
 * which sets `WEBINY_LOCAL_STORAGE_PATH`, the folder uploaded files are written to and served from.
 * Nothing is baked into the build: a deployed container sets both itself, and the API refuses to
 * start without the secret or without a storage.
 *
 * Leave `path` out when another extension provides the storage, such as `<Infra.FileStorage.S3 />`: a
 * folder only works when every API process runs on one machine.
 *
 * A relative storage path is resolved against the project root (not the disposable app workspace), so
 * uploaded files survive rebuilds — same rule as `Infra.Sqlite`.
 *
 * AWS hosting-type counterpart concept: the S3 bucket (`ApiFileManager`).
 */
export const FileStorage = defineExtension({
    type: "Infra/FileStorage",
    tags: { runtimeContext: "project", hosting: "standalone" },
    description:
        "Configure the standalone hosting type's local file storage directory and upload secret.",
    paramsSchema: z.object({
        path: z
            .string()
            .optional()
            .describe(
                "Path to the local file storage directory (absolute, or relative to the project root). Leave out when another extension provides the storage."
            ),
        uploadSecret: z.string().describe("Secret string used to sign file upload tokens.")
    }),
    render({ path: storagePathParam, uploadSecret }) {
        if (!storagePathParam) {
            return <EnvVar varName="WEBINY_UPLOAD_SECRET" value={uploadSecret} />;
        }

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
