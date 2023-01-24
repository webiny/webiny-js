import React from "react";
import { makeComposable } from "@webiny/app-core";
import { Tags } from "./Tags";

export interface LoginScreenProps {
    children: React.ReactNode;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ children }) => {
    return (
        <Tags tags={{ location: "loginScreen" }}>
            <LoginScreenRenderer>{children}</LoginScreenRenderer>
        </Tags>
    );
};

export const LoginScreenRenderer = makeComposable<LoginScreenProps>("LoginScreenRenderer");
