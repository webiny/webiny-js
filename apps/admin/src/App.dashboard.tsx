import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { DashboardConfig } from "@webiny/app-admin";
import "./App.scss";

const { Widget, View } = DashboardConfig;

const DashboardDecorator = View.createDecorator(() => {
    return function DashboardComponent() {
        return (
            <View.Container>
                <View.Header />
                <View.Widgets />
                <View.Footer />
            </View.Container>
        );
    };
});

export const App = () => {
    return (
        <Admin>
            <Cognito />
            <DashboardConfig>
                <DashboardDecorator />
            </DashboardConfig>
        </Admin>
    );
};
