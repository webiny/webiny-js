import React from "react";
import { ProjectServer } from "@webiny/project-server/extensions/ProjectServer.js";
import { DefaultExtensions } from "@webiny/project-template-base";
import { FeatureFlagsGate } from "@webiny/project";
import * as WebinyConfig from "../../webiny.config.js";

const FeatureFlags = "FeatureFlags" in WebinyConfig ? WebinyConfig.FeatureFlags : null;
const WebinyConfigTsx = WebinyConfig.Extensions;

/**
 * Server hosting-type project composition. Mirrors the AWS hosting type's base config, but renders the
 * hosting-agnostic `<ProjectServer />` (build/watch hooks only) instead of `<ProjectAws />` — there
 * is no Pulumi, no stack output, no `deploy`, and no deploy environments in the self-hosted hosting type.
 * The self-hosted IdP and any other extensions come in via the user's `webiny.config.tsx`.
 */
export const Extensions = () => {
    return (
        <>
            {FeatureFlags ? <FeatureFlags /> : null}
            <FeatureFlagsGate skip={!FeatureFlags}>
                <ProjectServer />
                <DefaultExtensions />
                <WebinyConfigTsx />
            </FeatureFlagsGate>
        </>
    );
};
