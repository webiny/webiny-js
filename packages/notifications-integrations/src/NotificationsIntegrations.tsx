import React from "react";
import { Api } from "@webiny/project/namespaces/index.js";

export const NotificationsIntegrations = () => {
    return <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />;
};
