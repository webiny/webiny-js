import React from "react";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { Api, Admin } from "@webiny/project-aws";

interface Auth0Props {
    issuer: string;
    clientId: string;
    apiConfig: string;
}

export const Auth0 = (props: Auth0Props) => {
    return (
        <>
            {/* Lambda vars */}
            <EnvVar.ReactComponent varName={"AUTH0_ISSUER"} value={props.issuer} />
            <EnvVar.ReactComponent varName={"REACT_APP_AUTH0_ISSUER"} value={props.issuer} />
            {/* Admin app vars */}
            <EnvVar.ReactComponent varName={"AUTH0_CLIENT_ID"} value={props.clientId} />
            <EnvVar.ReactComponent varName={"REACT_APP_AUTH0_CLIENT_ID"} value={props.clientId} />
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
};
