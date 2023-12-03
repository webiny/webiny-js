import React, { useRef } from "react";
import { App, Provider, ContentDecorator } from "@webiny/app";
import { WcpProvider } from "@webiny/app-wcp";
import { createBrowserHistory } from "history";
import { CircularProgress } from "@webiny/ui/Progress";
import { ThemeProvider } from "@webiny/app-theme";
import { TenancyProvider } from "./providers/TenancyProvider";
import { ApolloClientFactory, createApolloProvider } from "./providers/ApolloProvider";
import { Base } from "./Base";
import { createTelemetryProvider } from "./providers/TelemetryProvider";
import { createUiStateProvider } from "./providers/UiStateProvider";
import { SearchProvider } from "./ui/Search";
import { UserMenuProvider } from "./ui/UserMenu";
import { NavigationProvider } from "./ui/Navigation";
import { AdminRouter, RouteContent } from "./AdminRouter";
// import { Routes as SortRoutes } from "@webiny/app/core/Routes";

export interface AdminProps {
    createApolloClient: ApolloClientFactory;
    children?: React.ReactNode;
}

export const Admin: React.FC<AdminProps> = ({ children, createApolloClient }) => {
    const ApolloProvider = createApolloProvider(createApolloClient);
    const TelemetryProvider = createTelemetryProvider();
    const UiStateProvider = createUiStateProvider();

    const adminHistory = useRef(createBrowserHistory());

    const withRouter: ContentDecorator = element => (
        <AdminRouter history={adminHistory.current}>{element}</AdminRouter>
    );

    return (
        <ApolloProvider>
            <ThemeProvider>
                <WcpProvider loader={<CircularProgress label={"Loading..."} />}>
                    <TenancyProvider>
                        <App
                            contentDecorator={withRouter}
                            contentElement={<RouteContent history={adminHistory.current} />}
                        >
                            <Provider hoc={TelemetryProvider} />
                            <Provider hoc={UiStateProvider} />
                            <Provider hoc={SearchProvider} />
                            <Provider hoc={UserMenuProvider} />
                            <Provider hoc={NavigationProvider} />
                            <Base />
                            {children}
                        </App>
                    </TenancyProvider>
                </WcpProvider>
            </ThemeProvider>
        </ApolloProvider>
    );
};
