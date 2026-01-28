import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { Api, Admin } from "@webiny/project-aws";
import { z } from "zod";

export const Okta = defineExtension({
    type: "Project/Okta",
    tags: { runtimeContext: "project" },
    description: "Enable and configure Okta authentication.",
    paramsSchema: z.object({
        issuer: z.string().describe("Okta issuer URL."),
        clientId: z.string().describe("Okta client ID."),
        apiConfig: z.string().describe("Path to API configuration.")
    }),
    render: props => {
        return (
            <>
                {/* Lambda vars */}
                <EnvVar varName={"OKTA_ISSUER"} value={props.issuer} />
                <EnvVar varName={"OKTA_CLIENT_ID"} value={props.clientId} />
                {/* Admin app vars */}
                <EnvVar varName={"REACT_APP_IDP_TYPE"} value={"okta"} />
                <EnvVar varName={"REACT_APP_OKTA_ISSUER"} value={props.issuer} />
                <EnvVar varName={"REACT_APP_OKTA_CLIENT_ID"} value={props.clientId} />
                {/* Api extensions */}
                <Api.Extension
                    src={import.meta.dirname + "/api/features/OktaIdp/feature.js"}
                    exportName={"OktaIdpFeature"}
                />
                <Api.Extension src={props.apiConfig} />
                {/* Admin extensions */}
                <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
            </>
        );
    }
});
