import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { ACOProvider } from "@webiny/app-aco";
import "./App.scss";

export const AppFolders: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <ACOProvider />
        </Admin>
    );
};
