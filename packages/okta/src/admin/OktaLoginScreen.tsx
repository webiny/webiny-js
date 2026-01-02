import React from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { OktaFeature } from "~/admin/features/Okta/feature.js";
import { LoginContent } from "./components/LoginContent.js";

export interface CreateAuthenticationConfig {
    okta: { issuer: string; clientId: string }
    children: React.ReactNode;
}

export const OktaLoginScreen = observer(
    ({ okta, children }: CreateAuthenticationConfig) => {
        const { presenter } = useFeature(OktaFeature);

        const autoLogin = useMemo(() => {
            const query = new URLSearchParams(window.location.search);
            return query.get("action") !== "logout";
        }, []);

        useEffect(() => {
            presenter.init({
                issuer: okta.issuer,
                clientId: okta.clientId,
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
