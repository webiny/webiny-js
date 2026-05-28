import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";

const paramsSchema = z.object({
    retentionDays: z
        .number()
        .int()
        .min(0)
        .max(3650)
        .describe(
            "Default retention period (in days) for completed background task runs. 0 = never delete. Max 3650."
        )
});

export const BackgroundTasks = defineExtension({
    type: "Api/BackgroundTasks",
    tags: { runtimeContext: "project" },
    description:
        "Configure default settings for background tasks. The retention value is used as the default when no admin has explicitly set a value via the Settings UI.",
    paramsSchema,
    render(params) {
        return (
            <BuildParam paramName="BackgroundTasks.RetentionDays" value={params.retentionDays} />
        );
    }
});
