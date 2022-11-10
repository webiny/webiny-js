import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import "./App.scss";
import { PageElementsProvider } from "./components/PageElementsProvider";

export const App: React.FC = () => {
    return (
        <PageElementsProvider>
            <Admin>
                <Cognito />
            </Admin>
        </PageElementsProvider>
    );
};
