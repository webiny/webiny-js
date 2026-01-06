import React from "react";
import { Admin } from "webiny/extensions";
import { Extension as ApiExtension } from "./api/Extension.js";

export const AiTextWriter = () => {
    return (
        <>
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.tsx"} />
            <ApiExtension />
        </>
    );
};
