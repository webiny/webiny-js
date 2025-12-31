import React from "react";
import { Api } from "webiny/extensions";

interface Auth0Props {
    issuer: string;
    clientId: string;
    apiConfig: string;
}

export const Auth0 = (props: Auth0Props) => {
    return (
        <>
            <Api.Extension src={import.meta.dirname + "/../features/Auth0Idp/feature.js"} />
            <Api.Extension src={props.apiConfig} />
        </>
    );
};
