import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { AdminPlugins } from "./plugins/scaffolds/AdminPlugins";

import "./App.scss";

export const App = () => {
    return (
        <Admin>
            <Cognito />
            <AdminPlugins />
        </Admin>
    );
};
