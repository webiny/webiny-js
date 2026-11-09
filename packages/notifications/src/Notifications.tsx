import React from "react";
import { Api } from "@webiny/extensions";
import { Admin } from "@webiny/extensions";

export const Notifications = () => {
    return (
        <>
            {/* Api extensions */}
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />

            {/* Admin extensions */}
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </>
    );
};
