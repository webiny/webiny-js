// @flow
import { hot } from "react-hot-loader";
import React from "react";
import { Webiny, Router } from "webiny-app";
// import { addPlugin } from "webiny-plugins";
import { CmsProvider } from "webiny-app-cms/context";
import { app as cmsApp} from "webiny-app-cms/site";
import myTheme from "demo-theme";
import config from "./config";

cmsApp();

const App = () => {
    return (
        <Webiny config={config}>
            {({ router }) => (
                <CmsProvider theme={myTheme}>
                    <Router router={router} />
                </CmsProvider>
            )}
        </Webiny>
    );
};

export default hot(module)(App);
