import { defineExtension } from "~/defineExtension/index.js";
import { pulumiSrcParamsSchema } from "./pulumiSrcParamsSchema.js";

export const AdminPulumi = defineExtension({
    type: "Admin/Pulumi",
    tags: { runtimeContext: "project", appName: "admin", hosting: "aws" },
    description: "Modify Admin app's cloud infrastructure using Pulumi.",
    multiple: true,
    paramsSchema: pulumiSrcParamsSchema
});
