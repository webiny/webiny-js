import React from "react";
import { Languages } from "@webiny/languages";
import { TenantManager } from "@webiny/tenant-manager";
import { AiPowerups } from "@webiny/ai-powerups";

/**
 * Default feature extensions every Webiny project gets, shared across hosting types (aws + server). The
 * hosting-specific composition (`<ProjectAws />` / `<ProjectServer />`), any hosting-specific extensions
 * (e.g. `<Infra.ProductionEnvironments />`), and the user's `webiny.config.tsx` are added by each
 * hosting type's `webiny.config.base.tsx`.
 */
export const DefaultExtensions = () => {
    return (
        <>
            <Languages />
            <TenantManager />
            <AiPowerups />
        </>
    );
};
