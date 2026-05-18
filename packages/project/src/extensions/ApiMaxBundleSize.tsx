import React from "react";
import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";
import { EnvVar } from "~/extensions/EnvVar.js";

export const ApiMaxBundleSize = defineExtension({
    type: "Infra/Api/MaxBundleSize",
    tags: { runtimeContext: "project" },
    description: "Set the maximum bundle size for the API build.",
    paramsSchema: z.object({
        size: z.number().int().positive().describe("Maximum bundle size in bytes.")
    }),
    render({ size }) {
        return <EnvVar varName="WEBINY_INFRA_API_MAX_BUNDLE_SIZE" value={String(size)} />;
    }
});
