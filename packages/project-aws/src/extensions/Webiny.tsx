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
            <ProjectDecorator.ReactComponent src={p("Webiny/BuildAppWorkspace.js")} />

            {/* Stack Output Services */}
            <ProjectImplementation.ReactComponent
                src={p("Webiny/CoreStackOutputService.js")}
                singleton
            />
            <ProjectImplementation.ReactComponent
                src={p("Webiny/ApiStackOutputService.js")}
                singleton
            />
            <ProjectImplementation.ReactComponent
                src={p("Webiny/AdminStackOutputService.js")}
                singleton
            />

            <ProjectImplementation.ReactComponent
                src={p("../features/InvokeLambdaFunction.js")}
                singleton
            />

            <ProjectImplementation.ReactComponent
                src={p("../features/ApiGqlClient.js")}
                singleton
            />

            <AdminAfterDeploy.ReactComponent src={p("Webiny/UploadAdminAppToS3.js")} />
            <ApiAfterDeploy.ReactComponent src={p("Webiny/ExecuteDataMigrations.js")} />
            <ApiAfterDeploy.ReactComponent
                src={p("Webiny/AutoInstall/AutoInstallAfterApiDeploy.js")}
            />
            <ExtensionDefinitions.ReactComponent src={p("Webiny/definitions.js")} />

            {/* Admin env vars */}
            <AdminBeforeBuild.ReactComponent
                src={p("Webiny/SetAdminEnvVars/SetAdminEnvVarsBeforeBuild.js")}
            />
            <AdminBeforeWatch.ReactComponent
                src={p("Webiny/SetAdminEnvVars/SetAdminEnvVarsBeforeWatch.js")}
            />

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
