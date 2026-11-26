import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { EnvVar } from "@webiny/project/extensions/EnvVar.js";
import { S3Storage } from "@webiny/api-object-storage-s3/project.js";
import { s3StorageParamsSchema } from "@webiny/api-object-storage-s3/project.js";

/**
 * `<Infra.FileStorage.S3 />`: keeps a standalone project's uploaded files in an S3-compatible bucket
 * instead of a folder on disk, so any number of API processes on any number of machines share them.
 *
 * Adds the S3 storage (`S3Storage` from `@webiny/api-object-storage-s3`), which sets the
 * `WEBINY_S3_*` env vars, and sets `WEBINY_UPLOAD_SECRET` (signs upload tokens) for `webiny watch`
 * and `webiny serve`. Uploads still go through the API, so the secret is needed here too. Nothing is
 * baked into the build: a deployed container sets them itself, and the API reads them when it starts.
 */
export const S3FileStorage = defineExtension({
    type: "Infra/FileStorage/S3",
    tags: { runtimeContext: "project", hosting: "standalone" },
    description: "Keep the standalone hosting type's uploaded files in an S3-compatible bucket.",
    paramsSchema: s3StorageParamsSchema.extend({
        uploadSecret: z.string().describe("Secret string used to sign file upload tokens.")
    }),
    render({ uploadSecret, ...s3Params }) {
        return (
            <>
                <S3Storage {...s3Params} />
                <EnvVar varName="WEBINY_UPLOAD_SECRET" value={uploadSecret} />
            </>
        );
    }
});
