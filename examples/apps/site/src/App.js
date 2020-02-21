import { hot } from "react-hot-loader";
import React from "react";
import { registerPlugins, getPlugins } from "@webiny/plugins";
import { UiProvider } from "@webiny/app/contexts/Ui";
import plugins from "./plugins";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import "./App.scss";

registerPlugins(plugins);

// Execute `init` plugins, they may register more plugins dynamically
getPlugins("webiny-init").forEach(plugin => plugin.callback());

const App = () => {
    return (
        <I18NProvider>
            <UiProvider>
                {getPlugins("route").map(pl =>
                    React.cloneElement(pl.route, { key: pl.name, exact: true })
                )}
            </UiProvider>
        </I18NProvider>
    );
};

export default hot(module)(App);
