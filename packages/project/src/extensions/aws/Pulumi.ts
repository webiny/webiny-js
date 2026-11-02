import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";

/*
 * Specs of the `Core/Pulumi`, `Api/Pulumi` and `Admin/Pulumi` extensions, used by the shared
 * `Infra` namespace. They render the same config entry as the full definitions in
 * `@webiny/project-aws`, which register with the project and validate that `src` implements the
 * matching Pulumi abstraction.
 */
const paramsSchema = z.object({
    src: z.string().describe("Path to a file that implements the app's Pulumi abstraction.")
});

export const CorePulumi = defineExtension({
    type: "Core/Pulumi",
    tags: { runtimeContext: "project", appName: "core" },
    description: "Modify Core app's cloud infrastructure using Pulumi.",
    multiple: true,
    paramsSchema
});

export const ApiPulumi = defineExtension({
    type: "Api/Pulumi",
    tags: { runtimeContext: "project", appName: "api" },
    description: "Modify Api app's cloud infrastructure using Pulumi.",
    multiple: true,
    paramsSchema
});

export const AdminPulumi = defineExtension({
    type: "Admin/Pulumi",
    tags: { runtimeContext: "project", appName: "admin" },
    description: "Modify Admin app's cloud infrastructure using Pulumi.",
    multiple: true,
    paramsSchema
});
