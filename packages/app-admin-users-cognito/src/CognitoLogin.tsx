import React, { useEffect, useMemo } from "react";
import { LoginGraphQLFieldSelection } from "@webiny/app-admin/features/security/LogIn/abstractions.js";
import type { CreateAuthenticationConfig } from "~/createAuthentication/index.js";
import { createAuthentication } from "~/createAuthentication/index.js";
import { AdminConfig, LoginScreenRenderer, useContainer } from "@webiny/app-admin";
import { UserInfo } from "~/plugins/userMenu/UserInfo.js";
import { SignOut } from "~/plugins/userMenu/SignOut.js";

const { Menu } = AdminConfig;

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
            <AddLoginFieldSelection />
            <LoginScreenDecorator />
            {userMenuItems ? (
                <AdminConfig>
                    {userMenuItems.userInfo ? (
                        <Menu.User name={"userInfo"} element={<UserInfo />} />
                    ) : null}
                    {userMenuItems.signOut ? (
                        <Menu.User name={"signOut"} element={<SignOut />} />
                    ) : null}
                </AdminConfig>
            ) : null}
        </>
    );
};

const AddLoginFieldSelection = () => {
    const container = useContainer();

    useEffect(() => {
        container.registerInstance(LoginGraphQLFieldSelection, {
            getSelection() {
                return [
                    `
                        profile {
                            email
                            firstName
                            lastName
                            avatar
                        }
                    `
                ];
            }
        });
    }, []);

    return null;
};
