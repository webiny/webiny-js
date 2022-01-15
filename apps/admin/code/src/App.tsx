import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Okta } from "@webiny/app-admin-okta";
import { oktaSignIn, oktaAuth } from "./okta";
import "./App.scss";

export const App = () => {
    return (
        <Admin>
            <Okta oktaAuth={oktaAuth} oktaSignIn={oktaSignIn} />
        </Admin>
    );
};
