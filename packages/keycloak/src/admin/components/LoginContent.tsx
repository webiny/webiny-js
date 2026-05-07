import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { Button, Icon, OverlayLoader } from "@webiny/admin-ui";
import { ReactComponent as KeycloakIcon } from "./keycloak-icon.svg";
import { View } from "./View.js";

export interface LoginContentProps {
    isAuthenticated: boolean;
    isLoggingIn: boolean;
    checkingSession: boolean;
    onLogin: () => void;
}

export const LoginContent = makeDecoratable(
    "LoginContent",
    ({ onLogin, isLoggingIn, checkingSession, isAuthenticated }: LoginContentProps) => {
        return (
            <>
                {isLoggingIn ? <OverlayLoader text={"Logging in..."} /> : null}
                {checkingSession ? <OverlayLoader text={"Checking user session..."} /> : null}
                {!isAuthenticated && !isLoggingIn && !checkingSession ? (
                    <View.Container>
                        <View.Content>
                            <View.Title
                                title={"Sign In"}
                                description={
                                    "You will be taken to Keycloak to complete the sign in process."
                                }
                            />

                            <div className={"flex w-full"}>
                                <Button
                                    variant={"primary"}
                                    className={"w-full"}
                                    containerClassName={"w-full"}
                                    onClick={onLogin}
                                    icon={<Icon icon={<KeycloakIcon />} label={"Keycloak"} />}
                                    text={"Sign in with Keycloak"}
                                />
                            </div>
                        </View.Content>
                    </View.Container>
                ) : null}
            </>
        );
    }
);
