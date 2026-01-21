import React from "react";
import { Api } from "webiny/extensions";

export const MyIdpExtension = () => {
    return (
        <>
            <Api.Extension src={"/extensions/_wip/idp/MyIdp.ts"} />
        </>
    );
};
