import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { AdvancedPublishingWorkflow } from "@webiny/app-apw";
import "./App.scss";

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <AdvancedPublishingWorkflow />
        </Admin>
    );
};
