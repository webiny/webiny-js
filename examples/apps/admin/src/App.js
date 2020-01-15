import { hot } from "react-hot-loader";
import React from "react";
import { UiProvider } from "@webiny/app/contexts/Ui";
import { registerPlugins, getPlugins } from "@webiny/plugins";
import { ThemeProvider } from "@webiny/app-admin/contexts/Theme";
import { AppInstaller } from "@webiny/app-admin/components/Install/AppInstaller";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { SecurityProvider } from "@webiny/app-security/contexts/Security";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import { CircularProgress } from "@webiny/ui/Progress";
import "./App.scss";
import plugins from "./plugins";

registerPlugins(plugins);

// Execute `init` plugins, they may register more plugins dynamically
getPlugins("webiny-init").forEach(plugin => plugin.init());

const securityProvider = (
    <SecurityProvider loader={<CircularProgress label={"Checking user..."} />} />
);

const App = () => {
    return (
        <UiProvider>
            <I18NProvider loader={<CircularProgress label={"Loading locales..."} />}>
                <AppInstaller security={securityProvider}>
                    <PageBuilderProvider isEditor>
                        <ThemeProvider>
                            {getPlugins("route").map(pl =>
                                React.cloneElement(pl.route, {
                                    key: pl.name,
                                    exact: true
                                })
                            )}
                        </ThemeProvider>
                    </PageBuilderProvider>
                </AppInstaller>
            </I18NProvider>
        </UiProvider>
    );
};

export default hot(module)(App);
