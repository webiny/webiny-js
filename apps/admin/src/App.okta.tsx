import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Okta } from "@webiny/app-admin-okta";
import { AdminPlugins } from "./plugins/scaffolds/AdminPlugins";
import "./App.scss";

import { oktaFactory, rootAppClientId } from "./okta";

export const App = () => {
    return (
        <Admin>
            <Okta factory={oktaFactory} rootAppClientId={rootAppClientId} />
            <AdminPlugins />
        </Admin>
    );
};
