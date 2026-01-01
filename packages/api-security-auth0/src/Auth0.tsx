import React from "react";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { Api } from "@webiny/project-aws";

interface Auth0Props {
    issuer: string;
    clientId: string;
    apiConfig: string;
}

export const Auth0 = (props: Auth0Props) => {
    return (
        <>
            <EnvVar.ReactComponent varName={"AUTH0_ISSUER"} value={props.issuer} />
            <EnvVar.ReactComponent varName={"AUTH0_CLIENT_ID"} value={props.clientId} />
            <Api.Extension
                src={import.meta.dirname + "/features/Auth0Idp/feature.js"}
                exportName={"Auth0IdpFeature"}
            />
            <Api.Extension src={props.apiConfig} />
        </>
    );
};
