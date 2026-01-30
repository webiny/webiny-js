import React from "react";
import { ProjectAws } from "@webiny/project-aws/extensions/ProjectAws.js";
import { TenantManager } from "@webiny/tenant-manager";
import { Extensions as WebinyConfigTsx } from "../../webiny.config.js";

export const Extensions = () => {
    return (
        <>
            <ProjectAws />
            <TenantManager />
            <WebinyConfigTsx />
        </>
    );
};
