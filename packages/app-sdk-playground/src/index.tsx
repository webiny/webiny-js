import React, { memo } from "react";
import { useRouter, AdminConfig, AdminLayout } from "@webiny/app-admin";
import { ReactComponent as CodeIcon } from "@webiny/icons/code.svg";
import Playground from "./plugins/Playground.js";
import { Routes } from "./routes.js";

const { Route, Menu } = AdminConfig;

const SdkPlaygroundExtension = () => {
    const router = useRouter();

    return (
        <AdminConfig>
            <Menu.Support
                name={"sdk-playground"}
                element={
                    <Menu.Support.Link
                        text={"SDK Playground"}
                        icon={
                            <Menu.Support.Link.Icon label="SDK Playground" element={<CodeIcon />} />
                        }
                        to={router.getLink(Routes.SdkPlayground)}
                    />
                }
            />

            <Route
                route={Routes.SdkPlayground}
                element={
                    <AdminLayout title={"SDK Playground"}>
                        <Playground />
                    </AdminLayout>
                }
            />
        </AdminConfig>
    );
};

export const SdkPlayground = memo(SdkPlaygroundExtension);
