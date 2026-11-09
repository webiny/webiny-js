import React from "react";
import { Api } from "@webiny/project/exports/extensions.js";
import { Admin } from "@webiny/project/exports/extensions.js";

export const FrontendSettings = () => {
    return (
        <>
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </>
    );
};
