import React, { useMemo } from "react";
import { createAuthentication, CreateAuthenticationConfig } from "~/createAuthentication";
import { AddUserMenuItem, LoginScreenRenderer, Plugin } from "@webiny/app-admin";
import { UserInfo } from "~/plugins/userMenu/userInfo";
import { SignOut } from "~/plugins/userMenu/signOut";

const createLoginScreenDecorator = (config?: CreateAuthenticationConfig) => {
    const LoginComponent = createAuthentication(config);
    return LoginScreenRenderer.createDecorator(() => {
        return function LoginScreen({ children }) {
            return <LoginComponent>{children}</LoginComponent>;
        };
    });
};

export interface CognitoUserMenuItems {
    userInfo: boolean;
    signOut: boolean;
}

export interface CognitoProps {
    config?: CreateAuthenticationConfig;
    userMenuItems?: CognitoUserMenuItems;
}

export const CognitoLogin = ({ userMenuItems, config }: CognitoProps) => {
    const LoginScreenDecorator = useMemo(() => createLoginScreenDecorator(config), []);

    return (
        <>
            <LoginScreenDecorator />
            {userMenuItems ? (
                <Plugin>
                    {userMenuItems.userInfo ? <AddUserMenuItem element={<UserInfo />} /> : null}
                    {userMenuItems.signOut ? <AddUserMenuItem element={<SignOut />} /> : null}
                </Plugin>
            ) : null}
        </>
    );
};
