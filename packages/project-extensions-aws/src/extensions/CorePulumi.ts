import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { pulumiSrcParamsSchema } from "./pulumiSrcParamsSchema.js";

export const CorePulumi = defineExtension({
    type: "Core/Pulumi",
    tags: { runtimeContext: "project", appName: "core", hosting: "aws" },
    description: "Modify Core app's cloud infrastructure using Pulumi.",
    multiple: true,
    paramsSchema: pulumiSrcParamsSchema
});
