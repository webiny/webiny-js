import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "@apollo/react-hooks";
import get from "lodash/get";
import { LoginScreenRenderer, useTenancy, useTags } from "@webiny/app-serverless-cms";
import { createAuthentication, CreateAuthenticationConfig } from "./createAuthentication";
import { UserMenuModule } from "~/modules/userMenu";
import { AppClientModule } from "~/modules/appClient";
import { NotAuthorizedError } from "./components";

interface AppClientIdLoaderProps extends Auth0Props {
    children: React.ReactNode;
}

const GET_CLIENT_ID = gql`
    query GetAuth0ClientId {
        tenancy {
            appClientId
        }
    }
`;

const AppClientIdLoader = ({
    auth0,
    rootAppClientId,
    children,
    ...rest
}: AppClientIdLoaderProps) => {
    const [loaded, setState] = useState<boolean>(false);
    const authRef = useRef<React.ComponentType | null>(null);
    const client = useApolloClient();
    const { tenant, setTenant } = useTenancy();

    const setupAuthForClientId = (clientId: string) => {
        console.info(`Configuring Auth0 with App Client Id "${rootAppClientId}"`);
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

        if (tenantId === "root") {
            authRef.current = setupAuthForClientId(rootAppClientId);
            setState(true);
            return;
        }

        client.query({ query: GET_CLIENT_ID }).then(({ data }) => {
            const clientId = get(data, "tenancy.appClientId");
            if (clientId) {
                authRef.current = setupAuthForClientId(clientId);
                setState(true);
            } else {
                console.warn(`Couldn't load appClientId for tenant "${tenantId}"`);
            }
        });
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
    rootAppClientId: string;
    children?: React.ReactNode;
};

export const Auth0 = (props: Auth0Props) => {
    const LoginScreenPlugin = createLoginScreenPlugin(props);
    return (
        <Fragment>
            <LoginScreenPlugin />
            <UserMenuModule />
            <AppClientModule />
        </Fragment>
    );
};
