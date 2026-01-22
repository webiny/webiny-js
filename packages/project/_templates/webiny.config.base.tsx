import React from "react";
import { ProjectAws } from "@webiny/project-aws/extensions/ProjectAws.js";
import { Extensions as WebinyConfigTsx } from "../../webiny.config.js";

export const Extensions = () => {
    return (
        <>
            <ProjectAws />
            <WebinyConfigTsx />
        </>
    );
};
