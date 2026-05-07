import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { KeycloakFeature } from "~/admin/features/Keycloak/feature.js";
import { LoginContent } from "./components/index.js";

export interface KeycloakClientOptions {
    /**
     * Full realm URL — e.g., `http://localhost:8180/realms/webiny`.
     */
    issuer: string;
    clientId: string;
}

export interface CreateAuthenticationConfig {
    keycloak: KeycloakClientOptions;
    children: React.ReactNode;
}

export const KeycloakLoginScreen = observer(
    ({ keycloak, children }: CreateAuthenticationConfig) => {
        const { presenter } = useFeature(KeycloakFeature);

        const autoLogin = useMemo(() => {
            const query = new URLSearchParams(window.location.search);
            return query.get("action") !== "logout";
        }, []);

        useEffect(() => {
            presenter.init({
                issuer: keycloak.issuer,
                clientId: keycloak.clientId,
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
