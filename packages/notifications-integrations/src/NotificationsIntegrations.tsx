import React from "react";
import { Api } from "@webiny/project-extensions";

export const NotificationsIntegrations = () => {
    return <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />;
};
