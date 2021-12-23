import React from "react";
import { Extensions, Layout, AddMenu, AddRoute } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-security";
import FileManagerSettings from "~/admin/views/FileManagerSettings";

export const FileManager = () => {
    return (
        <Extensions>
            <HasPermission name={"fm.settings"}>
                <AddRoute path="/settings/file-manager/general">
                    <Layout title={"File Manager Settings - General"}>
                        <FileManagerSettings />
                    </Layout>
                </AddRoute>
                <AddMenu id={"settings"}>
                    <AddMenu id={"settings.fileManager"} label={"File Manager"}>
                        <AddMenu
                            id={"settings.fileManager.general"}
                            label={"General"}
                            path={"/settings/file-manager/general"}
                        />
                    </AddMenu>
                </AddMenu>
            </HasPermission>
        </Extensions>
    );
};
