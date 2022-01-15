import React from "react";
import { Compose, LoginScreenRenderer } from "@webiny/app-serverless-cms";
import { createAuthentication, Config } from "./createAuthentication";

const createLoginScreen = (config: Config) => {
    const Authentication = createAuthentication(config);

    return function OktaLoginScreenHOC() {
        return function OktaLoginScreen({ children }) {
            return <Authentication>{children}</Authentication>;
        };
    };
};

export type OktaProps = Config;

export const Okta = (props: OktaProps) => {
    return <Compose component={LoginScreenRenderer} with={createLoginScreen(props)} />;
};
