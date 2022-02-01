import React from "react";
import { Plugins, Layout, AddMenu, AddRoute } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-security";
import FileManagerSettings from "~/admin/views/FileManagerSettings";

export const FileManager = () => {
    return (
        <Plugins>
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
        </Plugins>
    );
};
