import { defineExtension } from "~/defineExtension/index.js";
import { pulumiSrcParamsSchema } from "./pulumiSrcParamsSchema.js";

export const ApiPulumi = defineExtension({
    type: "Api/Pulumi",
    tags: { runtimeContext: "project", appName: "api", hosting: "aws" },
    description: "Modify Api app's cloud infrastructure using Pulumi.",
    multiple: true,
    paramsSchema: pulumiSrcParamsSchema
});
