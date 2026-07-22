import React from "react";
import { ExtensionDefinitions, Project } from "@webiny/project/extensions/index.js";
import { createPathResolver } from "@webiny/project";

const p = createPathResolver(import.meta.dirname);

/**
 * Server hosting-type counterpart to project-aws's `<ProjectAws />`: renders the hosting-agnostic
 * `<Project />` (build/watch hooks) and registers the built-in extension definitions so the config
 * hydrator can resolve built-in extension types (Project/EnvVar, Admin/ApiUrl, hooks, ...). There is
 * no Pulumi, stack output, or deploy command here, so none of the AWS-only pieces apply.
 */
export const ProjectServer = () => {
    return (
        <>
            <Project />
            <ExtensionDefinitions src={p("definitions.js")} />
        </>
    );
};
