import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Okta } from "@webiny/app-admin-okta";
import { TenantManager } from "@webiny/app-tenant-manager";
import "./App.scss";

import { oktaFactory, rootAppClientId } from "./okta";

export const App: React.FC = () => {
    return (
        <Admin>
            <Okta factory={oktaFactory} rootAppClientId={rootAppClientId} />
            <TenantManager />
        </Admin>
    );
};
