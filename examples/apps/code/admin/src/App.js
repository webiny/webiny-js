// @flow
import { hot } from "react-hot-loader";
import React from "react";
import { UiProvider } from "@webiny/app/contexts/Ui";
import { registerPlugins, getPlugins } from "@webiny/plugins";
import { ThemeProvider } from "@webiny/app-admin/contexts/Theme";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { SecurityProvider } from "@webiny/app-security/contexts/Security";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import cognito from "@webiny/security-provider-cognito";
import myTheme from "theme";
import "./App.scss";
import plugins from "./plugins";

registerPlugins(
    plugins,
    cognito({
        region: "us-east-1",
        userPoolId: "us-east-1_patnytnzK",
        userPoolWebClientId: "4o0sgim1pol4mr75el5iqu0jcp"
    })
);

// Execute `init` plugins, they may register more plugins dynamically
getPlugins("webiny-init").forEach(plugin => plugin.init());

const App = () => {
    return (
        <UiProvider>
            <I18NProvider>
                <SecurityProvider>
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
                </SecurityProvider>
            </I18NProvider>
        </UiProvider>
    );
};

export default hot(module)(App);
