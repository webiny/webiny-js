import React from "react";
import { ApiExtension } from "@webiny/project/extensions/index.js";
import { AdminExtension } from "@webiny/project/extensions/index.js";

export const FrontendSettings = () => {
    return (
        <>
            <ApiExtension src={import.meta.dirname + "/api/Extension.js"} />
            <AdminExtension src={import.meta.dirname + "/admin/Extension.js"} />
        </>
    );
};
