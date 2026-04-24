import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { EnvVar } from "@webiny/project/extensions/index.js";

export const AwsDefaultRegion = defineExtension({
    type: "Aws/DefaultRegion",
    tags: { runtimeContext: "project" },
    description: "Set the default AWS region for the project.",
    paramsSchema: z.object({
        name: z.string().describe("The AWS region name.")
    }),
    render(props) {
        return <EnvVar varName="AWS_REGION" value={props.name} />;
    }
});
