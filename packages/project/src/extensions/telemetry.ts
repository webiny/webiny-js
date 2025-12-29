import { z } from "zod";
import { defineExtension } from "../defineExtension/defineExtension.js";

export const Telemetry = defineExtension({
    type: "Project/Telemetry",
    tags: { runtimeContext: "project" },
    description: "This extension allows you to enable or disable telemetry for the project.",
    paramsSchema: z.object({
        enabled: z.boolean().default(true)
    })
});
