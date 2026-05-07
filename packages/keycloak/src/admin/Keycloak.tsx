import React, { Fragment } from "react";
import { LoginScreenRenderer } from "@webiny/app-admin";
import { KeycloakLoginScreen, type CreateAuthenticationConfig } from "./KeycloakLoginScreen.js";

const createLoginScreenPlugin = (params: KeycloakProps) => {
    return LoginScreenRenderer.createDecorator(() => {
        return function Keycloak({ children }) {
            return <KeycloakLoginScreen {...params}>{children}</KeycloakLoginScreen>;
        };
    });
};

export type KeycloakProps = Pick<CreateAuthenticationConfig, "keycloak"> & {
    children?: React.ReactNode;
};

export const Keycloak = (props: KeycloakProps) => {
    const LoginScreenPlugin = createLoginScreenPlugin(props);
    return (
        <Fragment>
            <LoginScreenPlugin />
        </Fragment>
    );
};
