import React from "react";
import {
    AdminAfterDeploy,
    AdminBeforeBuild,
    AdminBeforeWatch,
    AfterDeploy,
    ApiAfterDeploy,
    BeforeDeploy,
    DatabaseSetup,
    ExtensionDefinitions,
    Project,
    ProjectDecorator,
    ProjectImplementation
} from "@webiny/project/extensions/index.js";
import { createPathResolver } from "@webiny/project";
import { CliCommandFactory } from "@webiny/cli-core/extensions/index.js";
import { Infra } from "~/index.js";

const p = createPathResolver(import.meta.dirname);

export const Webiny = () => {
    return (
        <>
            <Project />
            <ProjectDecorator src={p("Webiny/BuildAppWorkspace.js")} />

            {/* Database Setup - default to DynamoDB only */}
            <DatabaseSetup setupName="ddb" />

            {/* Set database setup output value in Core stack */}
            <Infra.Core.Pulumi src={p("Webiny/SetDatabaseSetupOutput.js")} />

            {/* Stack Output Services */}
            <ProjectImplementation src={p("Webiny/CoreStackOutputService.js")} singleton />
            <ProjectImplementation src={p("Webiny/ApiStackOutputService.js")} singleton />
            <ProjectImplementation src={p("Webiny/AdminStackOutputService.js")} singleton />

            <ProjectImplementation src={p("../features/InvokeLambdaFunction.js")} singleton />
            <ProjectImplementation src={p("../features/ApiGqlClient.js")} singleton />

            <AdminAfterDeploy src={p("Webiny/UploadAdminAppToS3.js")} />
            <ApiAfterDeploy src={p("Webiny/ExecuteDataMigrations.js")} />
            <ApiAfterDeploy src={p("Webiny/AutoInstall/AutoInstallAfterApiDeploy.js")} />
            <ExtensionDefinitions src={p("Webiny/definitions.js")} />

            {/* Admin env vars */}
            <AdminBeforeBuild src={p("Webiny/SetAdminEnvVars/SetAdminEnvVarsBeforeBuild.js")} />
            <AdminBeforeWatch src={p("Webiny/SetAdminEnvVars/SetAdminEnvVarsBeforeWatch.js")} />

            {/* Blue-green */}
            <CliCommandFactory src={p("Webiny/BlueGreenDeployments/SetPrimaryVariantCliCommand.js")} />
            <BeforeDeploy src={p("Webiny/BlueGreenDeployments/EnsureVariantBeforeDeploy.js")} />
            <AfterDeploy src={p("Webiny/BlueGreenDeployments/PrintDeploymentInfoAfterDeploy.js")} />
        </>
    );
};
