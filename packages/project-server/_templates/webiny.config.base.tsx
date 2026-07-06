import React from "react";
import { Project, ProductionEnvironments } from "@webiny/project/extensions/index.js";
import { TenantManager } from "@webiny/tenant-manager";
import { Languages } from "@webiny/languages";
import { AiPowerups } from "@webiny/ai-powerups";
import { Extensions as WebinyConfigTsx } from "../../webiny.config.js";

/**
 * Server-flavour project composition. Mirrors the AWS flavour's base config, but renders the
 * flavour-agnostic `<Project />` (build/watch hooks only) instead of `<ProjectAws />` — there is
 * no Pulumi, no stack output, and no `deploy` command here, so none of the AWS deploy/Pulumi hooks
 * apply. The self-hosted IdP and any other extensions come in via the user's `webiny.config.tsx`.
 */
export const Extensions = () => {
    return (
        <>
            <ProductionEnvironments environments={["prod", "production"]} />
            <Project />
            <Languages />
            <TenantManager />
            <AiPowerups />
            <WebinyConfigTsx />
        </>
    );
};
