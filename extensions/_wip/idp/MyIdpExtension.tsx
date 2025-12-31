import React from "react";
import { Api } from "webiny/extensions";

export const MyIdpExtension = () => {
    return (
        <>
            <Api.Extension src={import.meta.dirname + "/MyIdp.ts"} />
        </>
    );
};
