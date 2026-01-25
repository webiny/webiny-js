import React from "react";
import { createVoidComponent, makeDecoratable } from "@webiny/app";
import { Tags, useTags } from "./Tags.js";

export interface LoginScreenProps {
    children: React.ReactNode;
}

export const useIsInLoginScreen = () => {
    const { location } = useTags();
    return location === "loginScreen";
};

export const LoginScreen = ({ children }: LoginScreenProps) => {
    return (
        <Tags tags={{ location: "loginScreen" }}>
            <LoginScreenRenderer>
                <Tags tags={{ location: "loggedIn" }}>{children}</Tags>
            </LoginScreenRenderer>
        </Tags>
    );
};

export const LoginScreenRenderer = makeDecoratable(
    "LoginScreenRenderer",
    createVoidComponent<LoginScreenProps>()
);

export const LoginScreenComponent = LoginScreenRenderer;
