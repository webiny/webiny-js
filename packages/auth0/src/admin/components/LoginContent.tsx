import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { Button, Icon, OverlayLoader } from "@webiny/admin-ui";
import { ReactComponent as Auth0Icon } from "../assets/icons/auth0-icon.svg";
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
                                    "You will be taken to Auth0 website to complete the sign in process."
                                }
                            />

                            <div className={"flex w-full"}>
                                <Button
                                    variant={"primary"}
                                    className={"w-full"}
                                    containerClassName={"w-full"}
                                    onClick={onLogin}
                                    icon={<Icon icon={<Auth0Icon />} label={"Auth0"} />}
                                    text={"Sign in with Auth0"}
                                />
                            </div>
                        </View.Content>
                    </View.Container>
                ) : null}
            </>
        );
    }
);
