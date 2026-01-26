import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { LoginScreenComponent } from "webiny/admin/security";
import { OverlayLoader } from "webiny/admin/ui";
import { useFeature } from "webiny/admin";
import type { ITokens } from "../features/CustomIdp/abstractions.js";
import { CustomIdpFeature } from "../features/CustomIdp/feature.js";

interface CustomIdpViewProps {
    children: React.ReactNode;
}

export function getTokensFromUrl(): ITokens | undefined {
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

const LoginScreen = observer(({ children }: CustomIdpViewProps) => {
    const { presenter } = useFeature(CustomIdpFeature);

    useEffect(() => {
        const tokens = getTokensFromUrl();
        presenter.init(tokens);

        return () => {
            presenter.destroy();
        };
    }, [presenter]);

    const vm = presenter.vm;

    // Show children only when both IDP and Webiny are authenticated
    if (vm.isIdpAuthenticated && vm.isWebinyAuthenticated) {
        return <>{children}</>;
    }

    // Show refreshing state
    if (vm.isRefreshing) {
        return <OverlayLoader title="Verifying identity..." />;
    }

    // Show loading state
    return <OverlayLoader />;
});

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
