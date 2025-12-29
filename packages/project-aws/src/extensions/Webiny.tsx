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
            <ProjectDecorator.ReactComponent src={p("Webiny/BuildAppWorkspace.js")} />
            <AdminAfterDeploy.ReactComponent src={p("Webiny/UploadAdminAppToS3.js")} />
            <ApiAfterDeploy.ReactComponent src={p("Webiny/ExecuteDataMigrations.js")} />
            <ExtensionDefinitions.ReactComponent src={p("Webiny/definitions.js")} />

            {/* Blue-green */}
            <CliCommand.ReactComponent
                src={p("Webiny/BlueGreenDeployments/SetPrimaryVariantCliCommand.js")}
            />
            <BeforeDeploy.ReactComponent
                src={p("Webiny/BlueGreenDeployments/EnsureVariantBeforeDeploy.js")}
            />
            <AfterDeploy.ReactComponent
                src={p("Webiny/BlueGreenDeployments/PrintDeploymentInfoAfterDeploy.js")}
            />
        </>
    );
};
