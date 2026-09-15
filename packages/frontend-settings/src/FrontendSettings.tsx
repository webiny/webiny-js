import React from "react";
import { Api, Admin } from "@webiny/project-aws";

export const FrontendSettings = () => {
    return (
        <>
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </>
    );
};
