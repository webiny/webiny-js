import React from "react";
import { ProjectAws } from "@webiny/project-aws/extensions/ProjectAws.js";
import { Infra } from "@webiny/project-aws";
import { DefaultExtensions } from "@webiny/project-template-base";
import { RemoteComponents } from "@webiny/remote-components";
import { FeatureFlagsGate } from "@webiny/project";
import * as WebinyConfig from "../../webiny.config.js";

const FeatureFlags = "FeatureFlags" in WebinyConfig ? WebinyConfig.FeatureFlags : null;
const WebinyConfigTsx = WebinyConfig.Extensions;

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
