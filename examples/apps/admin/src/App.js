// @flow
import { hot } from "react-hot-loader";
import React from "react";
import { UiProvider } from "@webiny/app/contexts/Ui";
import { registerPlugins, getPlugins } from "@webiny/plugins";
import { ThemeProvider } from "@webiny/app-admin/contexts/Theme";
import { PublicInstall } from "@webiny/app-admin/components/Install/PublicInstall";
import { SecureInstall } from "@webiny/app-admin/components/Install/SecureInstall";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { SecurityProvider } from "@webiny/app-security/contexts/Security";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import cognito from "@webiny/app-plugin-security-cognito";
import myTheme from "theme";
import "./App.scss";
import plugins from "./plugins";

registerPlugins(
    plugins,
    cognito({
        region: process.env.REACT_APP_USER_POOL_REGION,
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
    })
);

// Execute `init` plugins, they may register more plugins dynamically
getPlugins("webiny-init").forEach(plugin => plugin.init());

const App = () => {
    return (
        <UiProvider>
            <I18NProvider>
                <PublicInstall>
                    <SecurityProvider>
                        <SecureInstall>
                            <PageBuilderProvider theme={myTheme} isEditor>
                                <ThemeProvider>
                                    {getPlugins("route").map((pl: Object) =>
                                        React.cloneElement(pl.route, {
                                            key: pl.name,
                                            exact: true
                                        })
                                    )}
                                </ThemeProvider>
                            </PageBuilderProvider>
                        </SecureInstall>
                    </SecurityProvider>
                </PublicInstall>
            </I18NProvider>
        </UiProvider>
    );
};

export default hot(module)(App);
