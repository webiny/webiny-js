import React from "react";
import { Admin, Extensions } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { TenantManager, AddTheme } from "@webiny/app-tenant-manager";
import "./App.scss";

export const App = () => {
    return (
        <Admin>
            <Cognito />
            <TenantManager />
            <Extensions>
                <AddTheme
                    name={"theme"}
                    label={"Theme A"}
                    loader={() => import("theme").then(m => m.default)}
                />
                <AddTheme
                    name={"theme-1"}
                    label={"Theme B"}
                    loader={() => import("theme-1").then(m => m.default)}
                />
            </Extensions>
        </Admin>
    );
};
