import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { z } from "zod";

export const FileManagerBucketVersioning = defineExtension({
    type: "Infra/FileManager/BucketVersioning",
    tags: { runtimeContext: "project" },
    description:
        "Enable or disable S3 versioning on the File Manager bucket. Enabled by default for production environments.",
    paramsSchema: z.object({
        enabled: z.boolean().describe("Whether to enable S3 bucket versioning.")
    })
});
