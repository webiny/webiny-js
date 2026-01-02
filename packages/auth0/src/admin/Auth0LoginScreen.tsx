import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import type { Auth0ClientOptions } from "@auth0/auth0-spa-js";
import { useFeature } from "@webiny/app";
import { Auth0Feature } from "~/admin/features/Auth0/feature.js";
import { LoginContent } from "./components/index.js";

export interface CreateAuthenticationConfig {
    auth0: Auth0ClientOptions;
    children: React.ReactNode;
}

export const Auth0LoginScreen = observer(
    ({ auth0, children }: CreateAuthenticationConfig) => {
        const { presenter } = useFeature(Auth0Feature);

        const autoLogin = useMemo(() => {
            const query = new URLSearchParams(window.location.search);
            return query.get("action") !== "logout";
        }, []);

        useEffect(() => {
            presenter.init({
                issuer: auth0.domain,
                clientId: auth0.clientId,
                autoLogin
            });
        }, []);

        const vm = presenter.vm;

        if (vm.isAuthenticated) {
            return <>{children}</>;
        }

        return (
            <LoginContent
                onLogin={() => presenter.authenticate()}
                checkingSession={vm.checkingSession}
                isLoggingIn={vm.isLoggingIn}
                isAuthenticated={vm.isAuthenticated}
            />
        );
    }
);
