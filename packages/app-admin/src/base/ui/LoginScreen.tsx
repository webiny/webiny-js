import React from "react";
import { makeComposable } from "@webiny/app-admin-core";

export interface LoginScreenProps {
    children: React.ReactNode;
}

export const LoginScreen = ({ children }: LoginScreenProps) => {
    return <LoginScreenRenderer>{children}</LoginScreenRenderer>;
};

export const LoginScreenRenderer = makeComposable<LoginScreenProps>("LoginScreenRenderer");
