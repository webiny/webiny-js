import React from "react";
import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";
import { EnvVar } from "~/extensions/EnvVar.js";

export const ApiMaxBundleSize = defineExtension({
    type: "Infra/Api/MaxBundleSize",
    tags: { runtimeContext: "project" },
    description: "Set the maximum bundle size for the API build.",
    paramsSchema: z.object({
        sizeInMb: z.number().positive().describe("Maximum bundle size in MB.")
    }),
    render({ sizeInMb }) {
        return <EnvVar varName="WEBINY_API_MAX_BUNDLE_SIZE" value={String(sizeInMb)} />;
    }
});
