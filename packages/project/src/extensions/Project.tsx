import React from "react";
import { createPathResolver } from "~/utils/createPathResolver.js";
import {
    AdminAfterDeploy,
    AdminBeforeBuild,
    AdminBeforeWatch,
    ApiAfterBuild,
    ApiBeforeDeploy,
    ApiBeforeWatch,
    BeforeDeploy,
    CoreBeforeDeploy
} from "~/extensions/index.js";

const p = createPathResolver(import.meta.dirname, "Project");

export const Project = () => {
    return (
        <>
            <AdminBeforeBuild src={p("SetAdminAppEnvVarsBeforeBuild.js")} />
            <AdminBeforeWatch src={p("SetAdminAppEnvVarsBeforeWatch.js")} />
            <AdminBeforeWatch src={p("ShowConfigChangeInfoBeforeWatch.js")} name="Admin" />
            <ApiAfterBuild src={p("WcpInjectTelemetryClientAfterBuild.js")} />
            <ApiBeforeDeploy src={p("EnsureCoreDeployedBeforeApiDeploy.js")} />
            <ApiBeforeWatch src={p("EnsureApiDeployedBeforeWatch.js")} />
            <ApiBeforeWatch src={p("ShowConfigChangeInfoBeforeWatch.js")} name="Api" />
            <AdminBeforeBuild src={p("EnsureApiDeployedBeforeAdminBuild.js")} />
            <AdminBeforeWatch src={p("EnsureApiDeployedBeforeAdminWatch.js")} />
            <AdminAfterDeploy src={p("TelemetryNoLongerNewUser.js")} />
            <BeforeDeploy src={p("EnsureTelemetryEnabledForOss.js")} />
            <CoreBeforeDeploy src={p("ValidateProductionPulumiState.js")} />
        </>
    );
};
