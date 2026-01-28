import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { Api, Admin } from "@webiny/project-aws";
import { z } from "zod";

export const Auth0 = defineExtension({
    type: "Project/Auth0",
    tags: { runtimeContext: "project" },
    description: "Enable and configure Auth0 authentication.",
    paramsSchema: z.object({
        issuer: z.string().describe("Auth0 issuer URL."),
        clientId: z.string().describe("Auth0 client ID."),
        apiConfig: z.string().describe("Path to API configuration.")
    }),
    render: props => {
        return (
            <>
                {/* Lambda vars */}
                <EnvVar varName={"AUTH0_ISSUER"} value={props.issuer} />
                <EnvVar varName={"AUTH0_CLIENT_ID"} value={props.clientId} />
                {/* Admin app vars */}
                <EnvVar varName={"REACT_APP_IDP_TYPE"} value={"auth0"} />
                <EnvVar varName={"REACT_APP_AUTH0_ISSUER"} value={props.issuer} />
                <EnvVar varName={"REACT_APP_AUTH0_CLIENT_ID"} value={props.clientId} />
                {/* Api extensions */}
                <Api.Extension
                    src={import.meta.dirname + "/api/features/Auth0Idp/feature.js"}
                    exportName={"Auth0IdpFeature"}
                />
                <Api.Extension src={props.apiConfig} />
                {/* Admin extensions */}
                <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
            </>
        );
    }
});
