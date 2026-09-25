import React from "react";
import { Api } from "@webiny/project-aws/api.js";
import { Admin } from "@webiny/project-aws/admin.js";
import { FeatureFlag } from "@webiny/project";

export const Languages = () => {
    return (
        <FeatureFlag.CanUseMultiTenancy>
            {/* Api extensions */}
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />

            {/* Admin extensions */}
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </FeatureFlag.CanUseMultiTenancy>
    );
};
