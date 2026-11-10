import React from "react";
import { Api } from "@webiny/project-aws/api.js";
import { Admin } from "@webiny/project-aws/admin.js";
import { FeatureFlag } from "@webiny/project";

/**
 * Project-level webhooks extension. With `webhooks: false` in the project's feature flags, neither
 * extension is rendered, so the webhooks code never makes it into the API or Admin build.
 */
export const Webhooks = () => {
    return (
        <FeatureFlag.CanUseWebhooks>
            {/* Api extensions */}
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />

            {/* Admin extensions */}
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </FeatureFlag.CanUseWebhooks>
    );
};
