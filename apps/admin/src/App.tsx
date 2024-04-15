import React from "react";
import { AdminPlugins } from "@demo/admin";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import "./App.scss";

export const App = () => {
    return (
        <Admin>
            <Cognito />
            <AdminPlugins />
        </Admin>
    );
};
