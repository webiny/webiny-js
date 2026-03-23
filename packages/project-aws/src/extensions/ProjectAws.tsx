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
import { CorePulumi } from "@webiny/project/extensions/index.js";
import { McpExtension } from "@webiny/mcp-extension";

const p = createPathResolver(import.meta.dirname);

export const ProjectAws = () => {
    return (
        <>
            <Project />
            <ProjectDecorator src={p("ProjectAws/BuildAppWorkspace.js")} />

            {/* Database Setup - default to DynamoDB only */}
            <DatabaseSetup setupName="ddb" />

            {/* Set database setup output value in Core stack */}
            <CorePulumi src={p("ProjectAws/SetDatabaseSetupOutput.js")} />

            {/* Stack Output Services */}
            <ProjectImplementation src={p("ProjectAws/CoreStackOutputService.js")} singleton />
            <ProjectImplementation src={p("ProjectAws/ApiStackOutputService.js")} singleton />
            <ProjectImplementation src={p("ProjectAws/AdminStackOutputService.js")} singleton />

            <ProjectImplementation src={p("../features/InvokeLambdaFunction.js")} singleton />
            <ProjectImplementation src={p("../features/ApiGqlClient.js")} singleton />

            <AdminAfterDeploy src={p("ProjectAws/UploadAdminAppToS3.js")} />

            <ApiAfterDeploy src={p("ProjectAws/AutoInstall/AutoInstallAfterApiDeploy.js")} />
            <ExtensionDefinitions src={p("definitions.js")} />
            <ExtensionDefinitions src={p("ProjectAws/definitions.js")} />

            {/* Admin env vars */}
            <AdminBeforeBuild src={p("ProjectAws/SetAdminEnvVars/SetAdminEnvVarsBeforeBuild.js")} />
            <AdminBeforeWatch src={p("ProjectAws/SetAdminEnvVars/SetAdminEnvVarsBeforeWatch.js")} />

            {/* AWS credentials check */}
            <BeforeDeploy src={p("ProjectAws/EnsureAwsCredentialsBeforeDeploy.js")} />

            {/* Blue-green */}
            <CliCommand src={p("ProjectAws/BlueGreenDeployments/SetPrimaryVariantCliCommand.js")} />
            <BeforeDeploy src={p("ProjectAws/BlueGreenDeployments/EnsureVariantBeforeDeploy.js")} />
            <AfterDeploy
                src={p("ProjectAws/BlueGreenDeployments/PrintDeploymentInfoAfterDeploy.js")}
            />

            {/* MCP */}
            <McpExtension />
        </>
    );
};
