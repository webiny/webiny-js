import React from "react";
import { Infra } from "webiny/extensions";
import { Cognito } from "@webiny/cognito";

export const Extensions = () => {
    return (
        <>
            <Infra.Aws.DefaultRegion name={"{REGION}"} />
            <Infra.OpenSearch enabled={true} />
            <Cognito />
        </>
    );
};
