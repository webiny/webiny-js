import React from "react";
import { createPathResolver } from "@webiny/project";
import { Infra } from "~/index.js";

const p = createPathResolver(import.meta.dirname, "AutoInstall");

export const AdminAutoInstall = () => {
    return <Infra.Api.AfterDeploy src={p("AutoInstallAfterFirstDeploy.js")} />;
};
