import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import { useRouter, AdminConfig, AdminLayout } from "@webiny/app-admin";
import { ReactComponent as CodeIcon } from "@webiny/icons/code.svg";
import Playground from "./plugins/Playground.js";
import sdkPlaygroundPlugins from "./plugins/index.js";
import { Routes } from "./routes.js";
import type { WebinyConfig } from "@webiny/sdk";

const { Route, Menu } = AdminConfig;

interface SdkPlaygroundProps {
    config: WebinyConfig;
}

const SdkPlaygroundExtension = ({ config }: SdkPlaygroundProps) => {
    const router = useRouter();
    plugins.register(sdkPlaygroundPlugins);

    return (
        <AdminConfig>
            <Menu.Support
                pin={"start"}
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
                        <Playground config={config} />
                    </AdminLayout>
                }
            />
        </AdminConfig>
    );
};

export const SdkPlayground = memo(SdkPlaygroundExtension);
