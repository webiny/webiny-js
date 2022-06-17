import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { TenantManager } from "@webiny/app-tenant-manager";
// import { ThemeManager } from "@webiny/app-theme-manager";
import "./App.scss";

// const themes = [
//     {
//         name: "theme-1",
//         label: "Theme 1",
//         load: () => import(/* webpackChunkName: 'theme-1' */ "theme").then(m => m.default)
//     }
// ];

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <TenantManager />
            {/*<ThemeManager themes={themes} />*/}
        </Admin>
    );
};
