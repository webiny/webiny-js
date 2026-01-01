import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { LoginScreenRenderer, useTenancy, useTags } from "@webiny/app-admin";
import type { CreateAuthenticationConfig } from "./createAuthentication.js";
import { createAuthentication } from "./createAuthentication.js";
import { UserMenuModule } from "./modules/userMenu/index.js";
import { NotAuthorizedError } from "./components/index.js";

interface AppClientIdLoaderProps extends Auth0Props {
    children: React.ReactNode;
}

const AppClientIdLoader = ({ auth0, children, ...rest }: AppClientIdLoaderProps) => {
    const [loaded, setState] = useState<boolean>(false);
    const authRef = useRef<React.ComponentType | null>(null);
    const { tenant, setTenant } = useTenancy();

    const setupAuthForClientId = (clientId: string) => {
        console.info(`Configuring Auth0 with App Client Id "${clientId}"`);
        return createAuthentication({
            ...rest,
            auth0: {
                ...auth0,
                clientId
            }
        });
    };

    useEffect(() => {
        // Check if `tenantId` query parameter is set.
        const searchParams = new URLSearchParams(location.search);
        const tenantId = searchParams.get("tenantId") || tenant || "root";

        if (tenantId && tenantId !== tenant) {
            setTenant(tenantId);
        }

        authRef.current = setupAuthForClientId(auth0.clientId);
        setState(true);
    }, []);

    return loaded
        ? React.createElement(authRef.current as React.ComponentType, {}, children)
        : null;
};

const createLoginScreenPlugin = (params: Auth0Props) => {
    return LoginScreenRenderer.createDecorator(() => {
        return function Auth0LoginScreen({ children }) {
            const { installer } = useTags();

            const [error, setError] = useState<string | null>(null);

            const onError = useCallback((error: Error) => {
                setError(error.message);
                params.onError && params.onError(error);
            }, []);

            if (error && !installer) {
                return <NotAuthorizedError />;
            }

            return (
                <AppClientIdLoader {...params} onError={onError}>
                    {children}
                </AppClientIdLoader>
            );
        };
    });
};

export type Auth0Props = Pick<
    CreateAuthenticationConfig,
    "auth0" | "autoLogin" | "onLogin" | "onLogout" | "onRedirect" | "onError"
> & {
    children?: React.ReactNode;
};

export const Auth0 = (props: Auth0Props) => {
    const LoginScreenPlugin = createLoginScreenPlugin(props);
    return (
        <Fragment>
            <LoginScreenPlugin />
            <UserMenuModule />
        </Fragment>
    );
};
