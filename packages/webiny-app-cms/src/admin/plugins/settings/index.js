// @flow
import * as React from "react";
import CmsSettings from "./components/CmsSettings";
import type { SettingsPluginType } from "webiny-app-admin/types";
import { ReactComponent as PagesIcon } from "./icons/round-ballot-24px.svg";

export default ([
    {
        name: "settings-cms",
        type: "settings",
        title: "CMS",
        description: "Manage CMS related settings.",
        icon: <PagesIcon />,
        render() {
            return <CmsSettings />;
        }
    }
]: Array<SettingsPluginType>);
