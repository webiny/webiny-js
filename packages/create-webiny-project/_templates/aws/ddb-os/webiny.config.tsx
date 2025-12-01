import React from "react";
import { Infra } from "webiny/extensions";

export const Extensions = () => {
    return (
        <>
            <Infra.OpenSearch enabled={true} />
        </>
    );
};
