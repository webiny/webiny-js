import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { TenantManager } from "@webiny/app-tenant-manager";
import "./App.scss";

export const App = () => {
    return (
        <Admin>
            <Cognito />
            <TenantManager />
        </Admin>
    );
};
