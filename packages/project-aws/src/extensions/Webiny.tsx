import React from "react";
import {
    AdminAfterDeploy,
    AfterDeploy,
    ApiAfterDeploy,
    BeforeDeploy,
    ExtensionDefinitions,
    Project,
    ProjectDecorator
} from "@webiny/project/extensions/index.js";
import { createPathResolver } from "@webiny/project";
import { CliCommand } from "@webiny/cli-core/extensions/index.js";

const p = createPathResolver(import.meta.dirname);

export const Webiny = () => {
    return (
        <>
            <Project />
            <ProjectDecorator src={p("Webiny/BuildAppWorkspace.js")} />
            <AdminAfterDeploy src={p("Webiny/UploadAdminAppToS3.js")} />
            <ApiAfterDeploy src={p("Webiny/ExecuteDataMigrations.js")} />
            <ExtensionDefinitions src={p("Webiny/definitions.js")} />

            {/* Blue-green */}
            <CliCommand src={p("Webiny/BlueGreenDeployments/SetPrimaryVariantCliCommand.js")} />
            <BeforeDeploy src={p("Webiny/BlueGreenDeployments/EnsureVariantBeforeDeploy.js")} />
            <AfterDeploy src={p("Webiny/BlueGreenDeployments/PrintDeploymentInfoAfterDeploy.js")} />
        </>
    );
};
