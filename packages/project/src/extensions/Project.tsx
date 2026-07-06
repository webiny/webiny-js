import React from "react";
import { createPathResolver } from "~/utils/createPathResolver.js";
import {
    AdminBeforeBuild,
    AdminBeforeWatch,
    ApiAfterBuild,
    ApiBeforeWatch
} from "~/extensions/index.js";

const p = createPathResolver(import.meta.dirname, "Project");

export const Project = () => {
    return (
        <>
            <AdminBeforeBuild src={p("SetAdminAppEnvVarsBeforeBuild.js")} />
            <AdminBeforeWatch src={p("SetAdminAppEnvVarsBeforeWatch.js")} />
            <AdminBeforeWatch src={p("ShowConfigChangeInfoBeforeAdminWatch.js")} />
            <ApiAfterBuild src={p("WcpInjectTelemetryClientAfterBuild.js")} />
            <ApiBeforeWatch src={p("ShowConfigChangeInfoBeforeApiWatch.js")} />
        </>
    );
};
