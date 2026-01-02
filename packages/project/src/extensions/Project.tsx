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
            <AdminBeforeBuild.ReactComponent src={p("SetAdminAppEnvVarsBeforeBuild.js")} />
            <AdminBeforeWatch.ReactComponent src={p("SetAdminAppEnvVarsBeforeWatch.js")} />
            <ApiAfterBuild.ReactComponent src={p("WcpInjectTelemetryClientAfterBuild.js")} />
            <ApiBeforeDeploy.ReactComponent src={p("EnsureCoreDeployedBeforeApiDeploy.js")} />
            <ApiBeforeWatch.ReactComponent src={p("EnsureApiDeployedBeforeWatch.js")} />
            <AdminBeforeBuild.ReactComponent src={p("EnsureApiDeployedBeforeAdminBuild.js")} />
            <AdminBeforeWatch.ReactComponent src={p("EnsureApiDeployedBeforeAdminWatch.js")} />
            <AdminAfterDeploy.ReactComponent src={p("TelemetryNoLongerNewUser.js")} />
            <BeforeBuild.ReactComponent src={p("WcpSetEnvVarsBeforeBuild.js")} />
            <BeforeWatch.ReactComponent src={p("WcpSetEnvVarsBeforeWatch.js")} />
        </>
    );
};
