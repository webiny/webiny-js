import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { Api, Admin, Infra } from "@webiny/project-aws";
import { z } from "zod";

export const Cognito = defineExtension({
    type: "Project/Cognito",
    tags: { runtimeContext: "project" },
    description: "Enable and configure Cognito authentication.",
    paramsSchema: z.object({
        apiConfig: z.string().describe("Path to API configuration.").optional()
    }),
    render: props => {
        return (
            <>
                <Infra.EnvVar varName={"REACT_APP_IDP_TYPE"} value={"cognito"} />
                {/* Api extensions */}
                <Api.Extension
                    src={import.meta.dirname + "/api/CognitoApiFeature.js"}
                    exportName={"CognitoApiFeature"}
                />
                {props.apiConfig ? <Api.Extension src={props.apiConfig} /> : null}
                {/* Admin extensions */}
                <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
            </>
        );
    }
});
