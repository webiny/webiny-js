import React from "react";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { Api, Admin } from "@webiny/project-aws";

export interface CognitoProps {
    apiConfig?: string;
}

export const Cognito = (props: CognitoProps) => {
    return (
        <>
            <EnvVar varName={"REACT_APP_IDP_TYPE"} value={"cognito"} />
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
};
