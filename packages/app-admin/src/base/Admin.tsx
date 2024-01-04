import React from "react";
import { App } from "@webiny/app";
import { WcpProvider } from "@webiny/app-wcp";
import { ApolloClientFactory, createApolloProvider } from "./providers/ApolloProvider";
import { Base } from "./Base";
import { createTelemetryProvider } from "./providers/TelemetryProvider";
import { createUiStateProvider } from "./providers/UiStateProvider";
import { SearchProvider } from "./ui/Search";
import { UserMenuProvider } from "./ui/UserMenu";
import { NavigationProvider } from "./ui/Navigation";
import { DefaultIcons, IconPickerConfigProvider } from "~/components/IconPicker/config";
import { CircularProgress } from "@webiny/ui/Progress";
import { ThemeProvider } from "@webiny/app-theme";

export interface AdminProps {
    createApolloClient: ApolloClientFactory;
    children?: React.ReactNode;
}

export const Admin: React.FC<AdminProps> = ({ children, createApolloClient }) => {
    const ApolloProvider = createApolloProvider(createApolloClient);
    const TelemetryProvider = createTelemetryProvider();
    const UiStateProvider = createUiStateProvider();

    return (
        <ApolloProvider>
            <ThemeProvider>
                <WcpProvider loader={<CircularProgress label={"Loading..."} />}>
                    <App
                        providers={[
                            TelemetryProvider,
                            UiStateProvider,
                            SearchProvider,
                            UserMenuProvider,
                            NavigationProvider,
                            IconPickerConfigProvider
                        ]}
                    >
                        <DefaultIcons />
                        <Base />
                        {children}
                    </App>
                </WcpProvider>
            </ThemeProvider>
        </ApolloProvider>
    );
};
