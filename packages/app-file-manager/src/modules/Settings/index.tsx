import React from "react";
import { plugins } from "@webiny/plugins";
import { AddRoute, Plugin } from "@webiny/app";
import { HasPermission } from "@webiny/app-security";
import { AddMenu, Layout } from "@webiny/app-admin";
import installation from "./plugins/installation";
import permissionRenderer from "./plugins/permissionRenderer";
import { FileManagerSettings } from "./views/FileManagerSettings";

export const SettingsModule = () => {
    plugins.register(installation, permissionRenderer);

    return (
        <Plugin>
            <HasPermission name={"fm.settings"}>
                <AddRoute path="/settings/file-manager/general">
                    <Layout title={"File Manager - General Settings"}>
                        <FileManagerSettings />
                    </Layout>
                </AddRoute>
                <AddMenu name={"settings"}>
                    <AddMenu name={"settings.fileManager"} label={"File Manager"}>
                        <AddMenu
                            name={"settings.fileManager.general"}
                            label={"General"}
                            path={"/settings/file-manager/general"}
                        />
                    </AddMenu>
                </AddMenu>
            </HasPermission>
        </Plugin>
    );
};
