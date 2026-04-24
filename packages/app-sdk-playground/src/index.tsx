import React, { memo } from "react";
import { useRouter, AdminConfig, AdminLayout, HasPermission } from "@webiny/app-admin";
import { ReactComponent as CodeIcon } from "@webiny/icons/code.svg";
import { ReactComponent as DevToolsIcon } from "@webiny/icons/developer_mode.svg";
import Playground from "./plugins/Playground.js";
import { SecurityPermission } from "./SecurityPermission.js";
import { Routes } from "./routes.js";

const { Route, Menu } = AdminConfig;

const SdkPlaygroundExtension = () => {
    const router = useRouter();

    return (
        <>
            <SecurityPermission />
            <AdminConfig>
                <Menu
                    name={"dev-tools"}
                    hideIfEmpty={true}
                    pin={"end"}
                    element={
                        <Menu.Item
                            text={"Dev Tools"}
                            icon={<Menu.Item.Icon label="Dev Tools" element={<DevToolsIcon />} />}
                        />
                    }
                />
                <HasPermission any={["dev-tools.*", "sdk-playground.*"]}>
                    <Menu
                        name={"dev-tools.sdk"}
                        parent={"dev-tools"}
                        element={
                            <Menu.Link
                                text={"SDK Playground"}
                                to={router.getLink(Routes.SdkPlayground)}
                                icon={
                                    <Menu.Link.Icon label="SDK Playground" element={<CodeIcon />} />
                                }
                            />
                        }
                    />
                </HasPermission>

                <Route
                    route={Routes.SdkPlayground}
                    element={
                        <AdminLayout title={"SDK Playground"}>
                            <Playground />
                        </AdminLayout>
                    }
                />
            </AdminConfig>
        </>
    );
};

export const SdkPlayground = memo(SdkPlaygroundExtension);
