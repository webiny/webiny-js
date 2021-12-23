import React, { FC, useEffect } from "react";
import { makeComposable } from "~/index";

export interface LoginScreenProps {
    children: React.ReactNode;
}

export const LoginScreen: FC<LoginScreenProps> = ({ children }) => {
    return <LoginScreenRenderer>{children}</LoginScreenRenderer>;
};

export const LoginScreenRenderer = makeComposable<LoginScreenProps>("LoginScreenRenderer", () => {
    useEffect(() => {
        console.info(
            `<LoginScreenRenderer/> is not implemented! To provide an implementation, use the <Compose/> component.`
        );
    }, []);

    return null;
});
