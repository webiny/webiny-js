import React from "react";
import { Infra } from "webiny/extensions";

export const Extensions = () => {
    return (
        <>
            <Infra.Aws.DefaultRegion name={"{REGION}"} />
        </>
    );
};
