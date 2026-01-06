import React from "react";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { Api, Admin } from "@webiny/project-aws";

interface OktaProps {
    issuer: string;
    clientId: string;
    apiConfig: string;
}

export const Okta = (props: OktaProps) => {
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
};
