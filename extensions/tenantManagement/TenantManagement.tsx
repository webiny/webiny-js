import React from "react";
import { Api, Admin } from "webiny/extensions";

export const TenantManagement = () => {
    return (
        <>
            {/* Api extensions */}
            <Api.Extension src={import.meta.dirname + "/api/Extension.ts"} />

            {/* Admin extensions */}
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.tsx"} />
        </>
    );
};
