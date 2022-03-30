import React from "react";
import { Plugins } from "@webiny/app-admin";
import ApwAdminMenus from "./menus";
import routes from "./routes";
import defaultBar from "./editor/defaultBar";
// Plugins for "page builder"
import { ApwOnPublish } from "./pageBuilder/ApwOnPublish";
import { ApwOnPageDelete } from "./pageBuilder/ApwOnDelete";

export default () => [routes, defaultBar];

export const ApwAdmin = () => {
    return (
        <Plugins>
            <ApwAdminMenus />
            <ApwOnPublish />
            <ApwOnPageDelete />
        </Plugins>
    );
};
