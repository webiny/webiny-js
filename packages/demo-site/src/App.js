// @flow
import { hot } from "react-hot-loader";
import React from "react";
import { Webiny, Router } from "webiny-app";
import { CmsProvider } from "webiny-app-cms/context";
import plugins from "./plugins";
import { registerPlugins } from "webiny-plugins";

import myTheme from "demo-theme";
import config from "./config";
import { GenericNotFoundPage, GenericErrorPage } from "./cms";

registerPlugins(...plugins);

const App = () => {
    return (
        <Webiny config={config}>
            {({ router }) => (
                <CmsProvider
                    theme={myTheme}
                    defaults={{
                        pages: {
                            notFound: GenericNotFoundPage,
                            error: GenericErrorPage
                        }
                    }}
                >
                    <Router router={router} />
                </CmsProvider>
            )}
        </Webiny>
    );
};

export default hot(module)(App);
