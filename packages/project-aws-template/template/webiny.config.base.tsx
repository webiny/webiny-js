import React from "react";
import { ProjectAws } from "@webiny/project-aws/extensions/ProjectAws.js";
import { TenantManager } from "@webiny/tenant-manager";
import { Languages } from "@webiny/languages";
import { Extensions as WebinyConfigTsx } from "../../webiny.config.js";

export const Extensions = () => {
  return (
    <>
      <ProjectAws />
      <Languages />
      <TenantManager />
      <WebinyConfigTsx />
    </>
  );
};
