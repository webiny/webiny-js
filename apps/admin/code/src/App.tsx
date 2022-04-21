import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { ApwAdmin } from "@webiny/app-apw/plugins";
import "./App.scss";

export const App = () => {
    return (
        <Admin>
            <Cognito />
            <ApwAdmin />
        </Admin>
    );
};
