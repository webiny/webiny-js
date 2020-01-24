import { hot } from "react-hot-loader";
import React from "react";
import { registerPlugins, getPlugins } from "@webiny/plugins";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { UiProvider } from "@webiny/app/contexts/Ui";
import { SecurityProvider } from "@webiny/app-security/contexts/Security";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import { GenericNotFoundPage, GenericErrorPage } from "./pageBuilder";
import plugins from "./plugins";
import "./App.scss";
import UserBar from "./components/UserBar";

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
        <I18NProvider>
            <UiProvider>
                <SecurityProvider allowAnonymous={true}>
                    <UserBar />
                    <PageBuilderProvider defaults={defaults}>
                        {getPlugins("route").map((pl: Object) =>
                            React.cloneElement(pl.route, { key: pl.name, exact: true })
                        )}
                    </PageBuilderProvider>
                </SecurityProvider>
            </UiProvider>
        </I18NProvider>
    );
};

export default hot(module)(App);
