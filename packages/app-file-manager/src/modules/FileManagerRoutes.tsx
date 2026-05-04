import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-admin";
import { ReactComponent as FileManagerIcon } from "@webiny/icons/folder_open.svg";
import { FileManagerView } from "~/presentation/FileManagerView.js";
import { Routes } from "~/routes.js";

const { Menu, Route } = AdminConfig;

// Registers the main File Manager route and navigation menu item.
export const FileManagerRoutes = () => {
    const { getLink } = useRouter();

    return (
        <AdminConfig>
            <HasPermission name={"fm.file"}>
                <Route
                    route={Routes.List}
                    element={
                        <AdminLayout title={"File Manager"}>
                            <FileManagerView />
                        </AdminLayout>
                    }
                />
                <Menu
                    name={"fileManager"}
                    pin={"start"}
                    element={
                        <Menu.Link
                            text={"File Manager"}
                            icon={
                                <Menu.Item.Icon
                                    label="File Manager"
                                    element={<FileManagerIcon />}
                                />
                            }
                            to={getLink(Routes.List)}
                        />
                    }
                />
            </HasPermission>
        </AdminConfig>
    );
};
