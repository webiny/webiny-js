import React from "react";
import type { Container } from "@webiny/di";
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
import { DateFormatterFeature } from "~/features/dateFormatter/feature.js";
import { ListPresenterFeature } from "~/presentation/listPresenter/index.js";
import { SortableFeature } from "~/presentation/sortable/index.js";
import { NotificationsRenderer } from "~/features/notifications/NotificationsRenderer.js";
import { ListCustomIconsFeature } from "~/features/iconPicker/listCustomIcons/feature.js";
import { CustomIconsPresenterFeature } from "~/presentation/iconPicker/customIcons/feature.js";
import { CommandPaletteFeature } from "~/presentation/commandPalette/index.js";
import { AdminCommandsFeature } from "~/presentation/commandPalette/commands/feature.js";

export interface AdminProps {
    createLegacyPlugins?: (container: Container) => PluginCollection;
    children?: React.ReactNode;
}

const container = createRootContainer();

export const Admin = ({ children, createLegacyPlugins }: AdminProps) => {
    if (createLegacyPlugins) {
        plugins.register(...createLegacyPlugins(container));
    }

    SecurityFeature.register(container);
    DateFormatterFeature.register(container);
    FormModelFeature.register(container);
    WebinySdkFeature.register(container);
    ListPresenterFeature.register(container);
    ListCustomIconsFeature.register(container);
    CustomIconsPresenterFeature.register(container);
    CommandPaletteFeature.register(container);
    AdminCommandsFeature.register(container);
    SortableFeature.register(container);

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
