import React, { useMemo } from "react";
import { LoginScreenComponent } from "webiny/admin/security";
import { LoginScreen } from "./LoginScreen.js";

export const CustomIdpView = () => {
    const LoginScreenDecorator = useMemo(() => {
        return LoginScreenComponent.createDecorator(() => {
            return function DecoratedLoginScreen({ children }) {
                return <LoginScreen>{children}</LoginScreen>;
            };
        });
    }, []);

    return <LoginScreenDecorator />;
};
