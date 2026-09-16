import React from "react";
import { ProjectStandalone } from "@webiny/project-standalone/extensions/ProjectStandalone.js";
import { DefaultExtensions } from "@webiny/project-template-base";
import { FeatureFlagsGate } from "@webiny/project";
import * as WebinyConfig from "../../webiny.config.js";

const FeatureFlags = "FeatureFlags" in WebinyConfig ? WebinyConfig.FeatureFlags : null;
const WebinyConfigTsx = WebinyConfig.Extensions;

/**
 * Standalone hosting-type project composition. Mirrors the AWS hosting type's base config, but renders the
 * hosting-agnostic `<ProjectStandalone />` (build/watch hooks only) instead of `<ProjectAws />` — there
 * is no Pulumi, no stack output, no `deploy`, and no deploy environments in the standalone hosting type.
 * The self-hosted IdP and any other extensions come in via the user's `webiny.config.tsx`.
 */
export const Extensions = () => {
    return (
        <>
            {FeatureFlags ? <FeatureFlags /> : null}
            <FeatureFlagsGate skip={!FeatureFlags}>
                <ProjectStandalone />
                <DefaultExtensions />
                <WebinyConfigTsx />
            </FeatureFlagsGate>
        </>
    );
};
