import React from "react";
import type { Container } from "@webiny/di";
import { plugins } from "@webiny/plugins";
import { App, DiContainerProvider } from "@webiny/app";
import type { ApolloClientFactory } from "./providers/ApolloProvider.js";
import { createApolloProvider } from "./providers/ApolloProvider.js";
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
import { ApolloClientFeature } from "~/features/apolloClient/feature.js";
import { SecurityFeature } from "~/features/security/SecurityFeature.js";
import type { PluginCollection } from "@webiny/plugins/types.js";

export interface AdminProps {
    createApolloClient: ApolloClientFactory;
    createLegacyPlugins: (container: Container) => PluginCollection;
    children?: React.ReactNode;
}

const container = createRootContainer();

export const Admin = ({ children, createApolloClient, createLegacyPlugins }: AdminProps) => {
    const uri = process.env.REACT_APP_GRAPHQL_API_URL as string;
    const apolloClient = createApolloClient({ uri });

    plugins.register(...createLegacyPlugins(container));

    ApolloClientFeature.register(container, apolloClient);
    SecurityFeature.register(container);

    const ApolloProvider = createApolloProvider(apolloClient);
    const UIProviders = createUiProviders();
    const UiStateProvider = createUiStateProvider();
    const AdminUiStateProvider = createAdminUiStateProvider();
    const DialogsProvider = createDialogsProvider();
    const TenancyProvider = createTenancyProvider();

    return (
        <DiContainerProvider container={container}>
            <TelemetryAdminAppStart />
            <ApolloProvider>
                <WcpProvider>
                    <App
                        routes={[]}
                        providers={[
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
                        {children}
                    </App>
                </WcpProvider>
            </ApolloProvider>
        </DiContainerProvider>
    );
};
