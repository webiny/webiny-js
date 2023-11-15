import React, {useCallback, useRef } from "react";
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
import { AdminRouter } from "./AdminRouter";
import { AdminHistory } from "~/base/AdminHistory";

export interface AdminProps {
    createApolloClient: ApolloClientFactory;
    children?: React.ReactNode;
}

export const Admin: React.FC<AdminProps> = ({ children, createApolloClient }) => {
    const ApolloProvider = createApolloProvider(createApolloClient);
    const TelemetryProvider = createTelemetryProvider();
    const UiStateProvider = createUiStateProvider();

    const adminHistory = useRef(new AdminHistory(createBrowserHistory()));

    const onTenant = useCallback(
        (tenantId: string) => {
            adminHistory.current.setTenant(tenantId);
        },
        [adminHistory.current]
    );

    const withRouter: ContentDecorator = element => (
        <AdminRouter history={adminHistory.current}>{element}</AdminRouter>
    );

    return (
        <ApolloProvider>
            <ThemeProvider>
                <WcpProvider loader={<CircularProgress label={"Loading..."} />}>
                    <TenancyProvider onTenant={onTenant}>
                        <App contentDecorator={withRouter}>
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
