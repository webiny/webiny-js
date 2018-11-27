// @flow
import * as React from "react";
import type { SettingsPluginType } from "webiny-app-admin/types";
import { ReactComponent as SettingsIcon } from "./icons/round-settings-24px.svg";
import IntegrationsList from "./IntegrationsList";

export default ({
    name: "settings-integrations-list",
    type: "settings",
    title: "Integrations",
    description: "Manage settings of installed integrations.",
    icon: <SettingsIcon />,
    component: <IntegrationsList />
}: SettingsPluginType);
