import React from "react";
import { Api } from "@webiny/project/exports/extensions.js";

export const NotificationsIntegrations = () => {
    return <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />;
};
