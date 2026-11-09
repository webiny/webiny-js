import React from "react";
import { Api } from "@webiny/project/exports/extensions.js";
import { Admin } from "@webiny/project/exports/extensions.js";
import { FeatureFlag } from "@webiny/project";

export const TenantManager = () => {
    return (
        <FeatureFlag.CanUseMultiTenancy>
            {/* Api extensions */}
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />

            {/* Admin extensions */}
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </FeatureFlag.CanUseMultiTenancy>
    );
};
