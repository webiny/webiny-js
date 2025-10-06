import React from "react";
import { createPathResolver } from "~/utils/createPathResolver.js";
import {
    AdminAfterDeploy,
    AdminBeforeBuild,
    AdminBeforeWatch,
    ApiAfterBuild,
    ApiBeforeDeploy,
    ApiBeforeWatch,
    BeforeBuild,
    BeforeWatch
} from "~/extensions/index.js";

const p = createPathResolver(import.meta.dirname, "Project");

export const Project = () => {
    return (
        <>
            <AdminBeforeBuild src={p("SetAdminAppEnvVarsBeforeBuild.js")} />
            <AdminBeforeWatch src={p("SetAdminAppEnvVarsBeforeWatch.js")} />
            <ApiAfterBuild src={p("WcpInjectTelemetryClientAfterBuild.js")} />
            <ApiBeforeDeploy src={p("EnsureCoreDeployedBeforeApiDeploy.js")} />
            <ApiBeforeWatch src={p("EnsureApiDeployedBeforeWatch.js")} />
            <AdminBeforeBuild src={p("EnsureApiDeployedBeforeAdminBuild.js")} />
            <AdminBeforeWatch src={p("EnsureApiDeployedBeforeAdminWatch.js")} />
            <AdminAfterDeploy src={p("TelemetryNoLongerNewUser.js")} />
            <BeforeWatch src={p("EnsureAppBuiltBeforeWatch.js")} />
            <BeforeBuild src={p("WcpSetEnvVarsBeforeBuild.js")} />
            <BeforeWatch src={p("WcpSetEnvVarsBeforeWatch.js")} />
        </>
    );
};
