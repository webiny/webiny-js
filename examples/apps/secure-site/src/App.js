import { hot } from "react-hot-loader";
import React from "react";
import { registerPlugins, getPlugins } from "@webiny/plugins";
import { UiProvider } from "@webiny/app/contexts/Ui";
import { SecurityProvider } from "@webiny/app-security/contexts/Security";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import plugins from "./plugins";
import "./App.scss";
import UserBar from "./components/UserBar";

registerPlugins(plugins);

// Execute `init` plugins, they may register more plugins dynamically
getPlugins("webiny-init").forEach(plugin => plugin.callback());

const App = () => {
    return (
        <I18NProvider>
            <UiProvider>
                <SecurityProvider allowAnonymous={true}>
                    <UserBar />
                    {getPlugins("route").map((pl: Object) =>
                        React.cloneElement(pl.route, { key: pl.name, exact: true })
                    )}
                </SecurityProvider>
            </UiProvider>
        </I18NProvider>
    );
};

export default hot(module)(App);
