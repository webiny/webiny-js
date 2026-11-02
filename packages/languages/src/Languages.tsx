import React from "react";
import { Api, Admin } from "@webiny/project/namespaces/index.js";
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
