import React from "react";
import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";
import { EnvVar } from "~/extensions/EnvVar.js";

export const AwsDefaultRegion = defineExtension({
    type: "Aws/DefaultRegion",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "Set the default AWS region for the project.",
    paramsSchema: z.object({
        name: z.string().describe("The AWS region name.")
    }),
    render(props) {
        return <EnvVar varName="AWS_REGION" value={props.name} />;
    }
});
