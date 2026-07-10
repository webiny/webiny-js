import React from "react";
import { ProjectServer } from "@webiny/project-server/extensions/ProjectServer.js";
import { DefaultExtensions } from "@webiny/project-template-base";
import { Extensions as WebinyConfigTsx } from "../../webiny.config.js";

/**
 * Server-flavour project composition. Mirrors the AWS flavour's base config, but renders the
 * flavour-agnostic `<ProjectServer />` (build/watch hooks only) instead of `<ProjectAws />` — there
 * is no Pulumi, no stack output, no `deploy`, and no deploy environments in the self-hosted flavour.
 * The self-hosted IdP and any other extensions come in via the user's `webiny.config.tsx`.
 */
export const Extensions = () => {
    return (
        <>
            <ProjectServer />
            <DefaultExtensions />
            <WebinyConfigTsx />
        </>
    );
};
