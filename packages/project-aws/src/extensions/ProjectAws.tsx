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
import { CliCommand } from "@webiny/cli-core/extensions/index.js";
import { Infra } from "~/index.js";

const p = createPathResolver(import.meta.dirname, "Webiny");

const ProjectAws = () => {
    return (
        <>
            <Project />
            <ProjectDecorator src={p("BuildAppWorkspace.js")} />

            {/* Database Setup - default to DynamoDB only */}
            <DatabaseSetup setupName="ddb" />

            {/* Set database setup output value in Core stack */}
            <Infra.Core.Pulumi src={p("SetDatabaseSetupOutput.js")} />

            {/* Stack Output Services */}
            <ProjectImplementation src={p("CoreStackOutputService.js")} singleton />
            <ProjectImplementation src={p("ApiStackOutputService.js")} singleton />
            <ProjectImplementation src={p("AdminStackOutputService.js")} singleton />

            <ProjectImplementation src={p("../features/InvokeLambdaFunction.js")} singleton />
            <ProjectImplementation src={p("../features/ApiGqlClient.js")} singleton />

            <AdminAfterDeploy src={p("UploadAdminAppToS3.js")} />
            <ApiAfterDeploy src={p("ExecuteDataMigrations.js")} />
            <ApiAfterDeploy src={p("AutoInstall/AutoInstallAfterApiDeploy.js")} />
            <ExtensionDefinitions src={p("definitions.js")} />

            {/* Admin env vars */}
            <AdminBeforeBuild src={p("SetAdminEnvVars/SetAdminEnvVarsBeforeBuild.js")} />
            <AdminBeforeWatch src={p("SetAdminEnvVars/SetAdminEnvVarsBeforeWatch.js")} />

            {/* Blue-green */}
            <CliCommand src={p("BlueGreenDeployments/SetPrimaryVariantCliCommand.js")} />
            <BeforeDeploy src={p("BlueGreenDeployments/EnsureVariantBeforeDeploy.js")} />
            <AfterDeploy src={p("BlueGreenDeployments/PrintDeploymentInfoAfterDeploy.js")} />
        </>
    );
};

export default ProjectAws;
