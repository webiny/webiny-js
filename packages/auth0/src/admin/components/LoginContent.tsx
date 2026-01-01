import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { makeDecoratable } from "@webiny/app-admin";
import { Button, Icon, OverlayLoader } from "@webiny/admin-ui";
import { ReactComponent as Auth0Icon } from "../assets/icons/auth0-icon.svg";
import { View } from "./View.js";

export interface LoginContentProps {
    isLoading: boolean;
    onLogin: () => void;
}

export const LoginContent = makeDecoratable(
    "LoginContent",
    ({ onLogin, isLoading }: LoginContentProps) => {
        const { isAuthenticated } = useAuth0();

        return (
            <>
                {isAuthenticated ? <OverlayLoader text={"Logging in..."} /> : null}
                {!isAuthenticated && isLoading ? (
                    <OverlayLoader text={"Checking user session..."} />
                ) : null}
                {!isAuthenticated && !isLoading ? (
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
