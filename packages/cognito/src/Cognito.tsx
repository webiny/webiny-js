import React from "react";
import { Api, Admin } from "@webiny/project-aws";

export interface CognitoProps {
    apiConfig?: string;
}

export const Cognito = (props: CognitoProps) => {
    return (
        <>
            {/* Api extensions */}
            <Api.Extension src={import.meta.dirname + "/api/CognitoApiFeature.js"} />
            {props.apiConfig ? <Api.Extension src={props.apiConfig} /> : null}
            {/* Admin extensions */}
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </>
    );
};
