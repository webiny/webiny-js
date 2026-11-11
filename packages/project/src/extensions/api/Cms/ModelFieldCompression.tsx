import React from "react";
import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";
import { BuildParam } from "~/extensions/ApiBuildParam.js";

const paramsSchema = z.object({
    enabled: z
        .boolean()
        .describe("Enable compression of model fields before storing in the database.")
});

export const ModelFieldCompression = defineExtension({
    type: "Api/Cms/ModelFieldCompression",
    tags: { runtimeContext: "project", hosting: "all" },
    description:
        "Enable or disable compression of Headless CMS model fields at the database storage level.",
    paramsSchema,
    render(params) {
        return <BuildParam paramName="ContentModelFieldCompression" value={params.enabled} />;
    }
});
