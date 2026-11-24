import React from "react";
import { ApiExtension } from "@webiny/project/extensions/index.js";
import { AdminExtension } from "@webiny/project/extensions/index.js";
import { FeatureFlag } from "@webiny/project";

export const TenantManager = () => {
    return (
        <FeatureFlag.CanUseMultiTenancy>
            {/* Api extensions */}
            <ApiExtension src={import.meta.dirname + "/api/Extension.js"} />

            {/* Admin extensions */}
            <AdminExtension src={import.meta.dirname + "/admin/Extension.js"} />
        </FeatureFlag.CanUseMultiTenancy>
    );
};
