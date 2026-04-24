import React from "react";
import { Infra } from "webiny/extensions";
import { Cognito } from "@webiny/cognito";

export const Extensions = () => {
    return (
        <>
            <Infra.Aws.DefaultRegion name={"{REGION}"} />
            {/* Encryption MUST always be configured for production environments. */}
            <Infra.Env.IsProd>
                <Infra.Encryption passphrase={process.env.WEBINY_ENCRYPTION_PASSPHRASE || ""} />
            </Infra.Env.IsProd>
            <Cognito />
        </>
    );
};
