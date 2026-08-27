import React from "react";
import { Api, Admin } from "@webiny/project-aws";
import { FeatureFlag } from "@webiny/project";

export const AiPowerups = () => {
    return (
        <FeatureFlag.CanUseAiPowerups>
            {/* Api extensions */}
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />

            {/* Admin extensions */}
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </FeatureFlag.CanUseAiPowerups>
    );
};
