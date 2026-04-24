import React from "react";
import { Api, Admin } from "@webiny/project-aws";
import { Wcp } from "@webiny/project";

export const TenantManager = () => {
    return (
        <Wcp.CanUseMultiTenancy>
            {/* Api extensions */}
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />

            {/* Admin extensions */}
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </Wcp.CanUseMultiTenancy>
    );
};
