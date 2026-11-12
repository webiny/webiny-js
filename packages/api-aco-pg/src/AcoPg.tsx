import React from "react";
import { z } from "zod";
import { ApiExtension, defineExtension } from "@webiny/project/extensions/index.js";

/**
 * Folder-level permissions on the Postgres CMS storage: a folder catalog kept in the same
 * transaction as folder writes, instead of the task-maintained one. Add it next to
 * `<HeadlessCmsPg />`.
 */
export const AcoPg = defineExtension({
    type: "Project/AcoPg",
    tags: { runtimeContext: "project", hosting: "all" },
    description: "Keep folder-level permissions in a Postgres folder catalog.",
    paramsSchema: z.object({}),
    render: () => {
        return (
            <ApiExtension
                src={import.meta.dirname + "/AcoPgExtension.js"}
                exportName={"AcoPgExtension"}
            />
        );
    }
});
