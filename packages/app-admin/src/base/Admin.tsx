import React from "react";
import { plugins } from "@webiny/plugins";
import { App, DiContainerProvider } from "@webiny/app";
import { Base } from "./Base.js";
import { createUiStateProvider } from "./providers/UiStateProvider.js";
import { createAdminUiStateProvider } from "./providers/AdminUiStateProvider.js";
import { createUiProviders } from "./providers/UiProviders.js";
import { createDialogsProvider } from "~/components/Dialogs/DialogsContext.js";
import { DefaultIcons, IconPickerConfigProvider } from "~/components/IconPicker/config/index.js";
import { createRootContainer } from "~/base/createRootContainer.js";
import { WcpProvider } from "~/presentation/wcp/WcpProvider.js";
import { createTenancyProvider } from "~/presentation/tenancy/createTenancyProvider.js";
import { TelemetryAdminAppStart } from "./TelemetryAdminAppStart.js";
import { SecurityFeature } from "~/features/security/SecurityFeature.js";
import { FormModelFeature } from "~/features/formModel/feature.js";
import type { PluginCollection } from "@webiny/plugins/types.js";
import { AdminConfigPlugin, AdminConfigProvider } from "~/config/AdminConfig.js";
import { WebinySdkFeature } from "~/features/webinySdk/feature.js";
import { ListPresenterFeature } from "~/presentation/listPresenter/index.js";
import { NotificationsRenderer } from "~/features/notifications/NotificationsRenderer.js";

export interface AdminProps {
    createLegacyPlugins: () => PluginCollection;
    children?: React.ReactNode;
}

const container = createRootContainer();

export const Admin = ({ children, createLegacyPlugins }: AdminProps) => {
    plugins.register(...createLegacyPlugins());

    SecurityFeature.register(container);
    FormModelFeature.register(container);
    WebinySdkFeature.register(container);
    ListPresenterFeature.register(container);

    const UIProviders = createUiProviders();
    const UiStateProvider = createUiStateProvider();
    const AdminUiStateProvider = createAdminUiStateProvider();
    const DialogsProvider = createDialogsProvider();
    const TenancyProvider = createTenancyProvider();

    return (
        <DiContainerProvider container={container}>
            <TelemetryAdminAppStart />
            <WcpProvider>
                <App
                    plugins={[AdminConfigPlugin]}
                    routes={[]}
                    providers={[
                        AdminConfigProvider,
                        UIProviders,
                        UiStateProvider,
                        DialogsProvider,
                        IconPickerConfigProvider,
                        AdminUiStateProvider,
                        TenancyProvider
                    ]}
                >
                    <Base />
                    <DefaultIcons />
                    <NotificationsRenderer />
                    {children}
                </App>
            </WcpProvider>
        </DiContainerProvider>
    );
};
