import React from "react";
import { Api } from "@webiny/extensions";
import { Admin } from "@webiny/extensions";

export const FrontendSettings = () => {
    return (
        <>
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </>
    );
};
