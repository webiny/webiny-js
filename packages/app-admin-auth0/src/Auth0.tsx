import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "@apollo/react-hooks";
import get from "lodash/get";
import {
    LoginScreenRenderer,
    useTenancy,
    createComponentPlugin,
    useTags
} from "@webiny/app-serverless-cms";
import {
    createAuthentication,
    Auth0Options,
    CreateAuthenticationConfig
} from "./createAuthentication";
import { UserMenuModule } from "~/modules/userMenu";
import { AppClientModule } from "~/modules/appClient";
import { NotAuthorizedError } from "./components";

interface AppClientIdLoaderProps {
    auth0: Auth0Options;
    rootAppClientId: string;
    children: React.ReactNode;
    onError?: CreateAuthenticationConfig["onError"];
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
    onError,
    children
}: AppClientIdLoaderProps) => {
    const [loaded, setState] = useState<boolean>(false);
    const authRef = useRef<React.ComponentType | null>(null);
    const client = useApolloClient();
    const { tenant, setTenant } = useTenancy();

    useEffect(() => {
        // Check if `tenantId` query parameter is set.
        const searchParams = new URLSearchParams(location.search);
        const tenantId = searchParams.get("tenantId") || tenant || "root";

        if (tenantId && tenantId !== tenant) {
            setTenant(tenantId);
        }

        if (tenantId === "root") {
            console.info(`Configuring Auth0 with App Client Id "${rootAppClientId}"`);
            authRef.current = createAuthentication({
                onError,
                auth0: {
                    ...auth0,
                    clientId: rootAppClientId
                }
            });
            setState(true);
            return;
        }

        client.query({ query: GET_CLIENT_ID }).then(({ data }) => {
            const clientId = get(data, "tenancy.appClientId");
            if (clientId) {
                console.info(`Configuring Auth0 with App Client Id "${clientId}"`);
                authRef.current = createAuthentication({
                    onError,
                    auth0: {
                        ...auth0,
                        clientId
                    }
                });
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
    return createComponentPlugin(LoginScreenRenderer, () => {
        return function Auth0LoginScreen({ children }) {
            const { installer } = useTags();

            const [error, setError] = useState<string | null>(null);

            const onError = useCallback((error: Error) => {
                setError(error.message);
            }, []);

            if (error && !installer) {
                return <NotAuthorizedError />;
            }

            return (
                <AppClientIdLoader
                    auth0={params.auth0}
                    rootAppClientId={params.rootAppClientId}
                    onError={onError}
                >
                    {children}
                </AppClientIdLoader>
            );
        };
    });
};

export interface Auth0Props {
    auth0: Auth0Options;
    rootAppClientId: string;
    children?: React.ReactNode;
}

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
