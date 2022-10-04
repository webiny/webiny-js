import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { Folders } from "@webiny/app-folders";
import "./App.scss";

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <Folders />
        </Admin>
    );
};
