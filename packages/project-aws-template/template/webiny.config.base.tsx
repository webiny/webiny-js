import React from "react";
import { ProjectAws } from "@webiny/project-aws/extensions/ProjectAws.js";
import { Infra } from "@webiny/project-aws";
import { TenantManager } from "@webiny/tenant-manager";
import { Languages } from "@webiny/languages";
import { AiPowerups } from "@webiny/ai-powerups";
import { Extensions as WebinyConfigTsx } from "../../webiny.config.js";

export const Extensions = () => {
    return (
        <>
            <Infra.ProductionEnvironments environments={["prod", "production"]} />
            <ProjectAws />
            <Languages />
            <TenantManager />
            <AiPowerups />
            <WebinyConfigTsx />
        </>
    );
};
