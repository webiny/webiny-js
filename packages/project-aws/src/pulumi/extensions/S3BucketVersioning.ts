import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { z } from "zod";

export const S3BucketVersioning = defineExtension({
    type: "Infra/S3Bucket/Versioning",
    tags: { runtimeContext: "project" },
    description:
        "Enable or disable S3 versioning on the core S3 bucket, where File Manager stores uploaded files. Enabled by default for production environments.",
    paramsSchema: z.object({
        enabled: z.boolean().describe("Whether to enable S3 bucket versioning.")
    })
});
