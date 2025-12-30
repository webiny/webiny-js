import React from "react";
import {
    AdminAfterDeploy,
    AdminBeforeBuild,
    AdminBeforeWatch,
    AfterDeploy,
    ApiAfterDeploy,
    BeforeDeploy,
    ExtensionDefinitions,
    Project,
    ProjectDecorator,
    ProjectImplementation
} from "@webiny/project/extensions/index.js";
import { createPathResolver } from "@webiny/project";
import { CliCommand } from "@webiny/cli-core/extensions/index.js";

const p = createPathResolver(import.meta.dirname);

export const Webiny = () => {
    return (
        <>
            <Project />
            <ProjectDecorator src={p("Webiny/BuildAppWorkspace.js")} />

            {/* Stack Output Services */}
            <ProjectImplementation src={p("Webiny/CoreStackOutputService.js")} singleton />
            <ProjectImplementation src={p("Webiny/ApiStackOutputService.js")} singleton />
            <ProjectImplementation src={p("Webiny/AdminStackOutputService.js")} singleton />

            <AdminAfterDeploy src={p("Webiny/UploadAdminAppToS3.js")} />
            <ApiAfterDeploy src={p("Webiny/ExecuteDataMigrations.js")} />
            <ExtensionDefinitions src={p("Webiny/definitions.js")} />

            {/* Admin env vars */}
            <AdminBeforeBuild src={p("Webiny/SetAdminEnvVars/SetAdminEnvVarsBeforeBuild.js")} />
            <AdminBeforeWatch src={p("Webiny/SetAdminEnvVars/SetAdminEnvVarsBeforeWatch.js")} />

            {/* Blue-green */}
            <CliCommand src={p("Webiny/BlueGreenDeployments/SetPrimaryVariantCliCommand.js")} />
            <BeforeDeploy src={p("Webiny/BlueGreenDeployments/EnsureVariantBeforeDeploy.js")} />
            <AfterDeploy src={p("Webiny/BlueGreenDeployments/PrintDeploymentInfoAfterDeploy.js")} />
        </>
    );
};
