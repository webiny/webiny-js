import React from "react";
import { ProjectAws } from "@webiny/project-aws/extensions/ProjectAws.js";
import { Infra } from "@webiny/project-aws";
import { DefaultExtensions } from "@webiny/project-template-base";
import { RemoteComponents } from "@webiny/remote-components";
import { FeatureFlagsGate } from "@webiny/project";
import { FeatureFlags, Extensions as WebinyConfigTsx } from "../../webiny.config.js";

export const Extensions = () => {
    return (
        <>
            {FeatureFlags ? <FeatureFlags /> : null}
            <FeatureFlagsGate skip={!FeatureFlags}>
                <Infra.ProductionEnvironments environments={["prod", "production"]} />
                <ProjectAws />
                <DefaultExtensions />
                <RemoteComponents />
                <WebinyConfigTsx />
            </FeatureFlagsGate>
        </>
    );
};
