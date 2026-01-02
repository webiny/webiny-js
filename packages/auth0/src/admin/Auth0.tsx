import React, { Fragment } from "react";
import { LoginScreenRenderer } from "@webiny/app-admin";
import { Auth0LoginScreen, type CreateAuthenticationConfig } from "./Auth0LoginScreen.js";
import { UserMenuModule } from "./modules/userMenu/index.js";

const createLoginScreenPlugin = (params: Auth0Props) => {
    return LoginScreenRenderer.createDecorator(() => {
        return function Auth0({ children }) {
            return <Auth0LoginScreen {...params}>{children}</Auth0LoginScreen>;
        };
    });
};

export type Auth0Props = Pick<CreateAuthenticationConfig, "auth0"> & {
    children?: React.ReactNode;
};

export const Auth0 = (props: Auth0Props) => {
    const LoginScreenPlugin = createLoginScreenPlugin(props);
    return (
        <Fragment>
            <LoginScreenPlugin />
            <UserMenuModule />
        </Fragment>
    );
};
