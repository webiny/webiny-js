import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo } from "react";
import { LoginScreenComponent, useAuthentication } from "webiny/admin/security";
import { OverlayLoader } from "webiny/admin/ui";
import { type Tokens, type GetFreshTokens, type GoToLogin, type OnLogout } from "./types.js";
import type { ApiError } from "./types.js";
import { Authenticator } from "./Authenticator.js";

interface CustomIdpProps {
    goToLogin: () => GoToLogin;
    getFreshTokens: () => GetFreshTokens;
    onLogout: () => OnLogout;
    onError?: () => (error: ApiError) => void;
    refreshInterval: number;
}

/**
 * Intercept the LoginScreenComponent and run the custom IdP logic.
 */
export const CustomIdp = (props: CustomIdpProps) => {
    const LoginScreenDecorator = useMemo(() => {
        return LoginScreenComponent.createDecorator(() => {
            return function LoginScreenComponent({ children }) {
                return <LoginScreen {...props}>{children}</LoginScreen>;
            };
        });
    }, []);

    return <LoginScreenDecorator />;
};

type Children = {
    children: React.ReactNode;
};

/**
 * This components is responsible for running the Authenticator, and rendering the appropriate UI.
 */
const LoginScreen = observer(({ children, ...props }: CustomIdpProps & Children) => {
    const { identity, login } = useAuthentication();
    const goToLogin = props.goToLogin();
    const getFreshTokens = props.getFreshTokens();
    const onLogout = props.onLogout();

    const authenticator = useMemo(() => {
        return new Authenticator(goToLogin, getFreshTokens, onLogout, props.refreshInterval);
    }, []);

    const { isAuthenticated, isRefreshing } = authenticator.vm;

    /**
     * On first mount, we initiate your Custom IDP authentication process.
     */
    useEffect(() => {
        // Parse tokens from URL and initialize Authenticator.
        const tokens = getTokensFromUrl();
        authenticator.init(tokens);

        return () => {
            authenticator.destroy();
        };
    }, [authenticator]);

    /**
     * Once the user is authenticated with your IDP, we need to log in using Webiny authentication.
     */
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        login({
            idTokenProvider: () => {
                return authenticator.getIdToken();
            },
            logoutCallback: () => {
                authenticator.logout("userAction");
            }
        });
    }, [authenticator, isAuthenticated, login]);

    return (
        <>
            {isAuthenticated && identity ? children : null}
            {!isAuthenticated && isRefreshing ? (
                <OverlayLoader title={"Verifying identity..."} />
            ) : null}
            {!isAuthenticated && !isRefreshing ? <OverlayLoader /> : null}
        </>
    );
});

export function getTokensFromUrl(): Tokens | undefined {
    const data = new URLSearchParams(window.location.search);
    const idToken = data.get("idToken") ?? undefined;
    const refreshToken = data.get("refreshToken") ?? undefined;

    const url = new URL(window.location.href);
    url.searchParams.delete("idToken");
    url.searchParams.delete("refreshToken");

    window.history.replaceState({}, document.title, url.toString());

    if (!idToken || !refreshToken) {
        return undefined;
    }

    return { idToken, refreshToken };
}
