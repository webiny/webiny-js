import React from "react";
import { createVoidComponent, makeDecoratable } from "@webiny/app";
import { Tags } from "./Tags";

export interface LoginScreenProps {
    children: React.ReactNode;
}

export const LoginScreen = ({ children }: LoginScreenProps) => {
    return (
        <Tags tags={{ location: "loginScreen" }}>
            <LoginScreenRenderer>{children}</LoginScreenRenderer>
        </Tags>
    );
};

export const LoginScreenRenderer = makeDecoratable(
    "LoginScreenRenderer",
    createVoidComponent<LoginScreenProps>()
);
