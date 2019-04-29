import { hot } from "react-hot-loader";
import React, { cloneElement } from "react";
import { registerPlugins, getPlugins } from "webiny-plugins";
import { CmsProvider } from "webiny-app-cms/context";
import { UiProvider } from "webiny-app/context/ui";
import plugins from "./plugins";
import theme from "theme";
import { GenericNotFoundPage, GenericErrorPage } from "./cms";

// Register all plugins
registerPlugins(plugins);

// Execute `init` plugins, they may register more plugins dynamically
getPlugins("webiny-init").forEach(plugin => plugin.callback());

const defaults = {
    pages: {
        notFound: GenericNotFoundPage,
        error: GenericErrorPage
    }
};

const App = () => {
    return (
        /* UiProvider is a provider for UI state (dialogs, snackbars, dark theme, ...) */
        <UiProvider>
            {/* CmsProvider gives access to `theme` object */}
            <CmsProvider theme={theme} defaults={defaults}>
                {/* Get all `route` plugins and render them. */}
                {getPlugins("route").map((pl: Object) => cloneElement(pl.route, { key: pl.name }))}
            </CmsProvider>
        </UiProvider>
    );
};

export default hot(module)(App);
