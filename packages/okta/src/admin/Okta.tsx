import React from "react";
import { Fragment } from "react";
import { LoginScreenRenderer } from "@webiny/app-admin";
import { OktaLoginScreen } from "./OktaLoginScreen.js";
import type { CreateAuthenticationConfig } from "./OktaLoginScreen.js";

const createLoginScreenPlugin = (params: OktaProps) => {
    return LoginScreenRenderer.createDecorator(() => {
        return function Okta({ children }) {
            return <OktaLoginScreen {...params}>{children}</OktaLoginScreen>;
        };
    });
};

export type OktaProps = Pick<CreateAuthenticationConfig, "okta"> & {
    children?: React.ReactNode;
};

export const Okta = (props: OktaProps) => {
    const LoginScreenPlugin = createLoginScreenPlugin(props);
    return (
        <Fragment>
            <LoginScreenPlugin />
        </Fragment>
    );
};
