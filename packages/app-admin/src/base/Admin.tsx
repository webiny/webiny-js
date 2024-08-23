import React from "react";
import { App, Provider } from "@webiny/app";
import { ThemeProvider } from "@webiny/app-theme";
import { WcpProvider } from "@webiny/app-wcp";
import { CircularProgress } from "@webiny/ui/Progress";
import { Providers as UiProviders } from "@webiny/ui-new";
import { ApolloClientFactory, createApolloProvider } from "./providers/ApolloProvider";
import { Base } from "./Base";
import { createTelemetryProvider } from "./providers/TelemetryProvider";
import { createUiStateProvider } from "./providers/UiStateProvider";
import { SearchProvider } from "./ui/Search";
import { UserMenuProvider } from "./ui/UserMenu";
import { NavigationProvider } from "./ui/Navigation";
import { createDialogsProvider } from "~/components/Dialogs/DialogsContext";

export interface AdminProps {
    createApolloClient: ApolloClientFactory;
    children?: React.ReactNode;
}

export const Admin = ({ children, createApolloClient }: AdminProps) => {
    const ApolloProvider = createApolloProvider(createApolloClient);
    const TelemetryProvider = createTelemetryProvider();
    const UiStateProvider = createUiStateProvider();
    const DialogsProvider = createDialogsProvider();

    return (
        <ApolloProvider>
            <ThemeProvider>
                <UiProviders>
                    <WcpProvider loader={<CircularProgress label={"Loading..."} />}>
                        <App>
                            <Provider hoc={TelemetryProvider} />
                            <Provider hoc={UiStateProvider} />
                            <Provider hoc={SearchProvider} />
                            <Provider hoc={UserMenuProvider} />
                            <Provider hoc={NavigationProvider} />
                            <Provider hoc={DialogsProvider} />
                            <Base />
                            {children}
                        </App>
                    </WcpProvider>
                </UiProviders>
            </ThemeProvider>
        </ApolloProvider>
    );
};
