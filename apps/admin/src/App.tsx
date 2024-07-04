import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { Extensions } from "./Extensions";
import "./App.scss";

export const App = () => {
    return (
        <Admin>
            <Cognito />
            <Extensions />
            <p className={"bg-brand text-primary-foreground  hover:bg-brand/80"}>Demo</p>
        </Admin>
    );
};
