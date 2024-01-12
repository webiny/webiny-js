import React, { Fragment, useEffect, useRef, useState } from "react";
import get from "lodash/get";
import { LoginScreenRenderer, useTenancy, createComponentPlugin } from "@webiny/app-serverless-cms";
import { createAuthentication, Auth0Options } from "./createAuthentication";
import { UserMenuModule } from "~/modules/userMenu";
import { AppClientModule } from "~/modules/appClient";
import { useApolloClient } from "@apollo/react-hooks";
import gql from "graphql-tag";

interface AppClientIdLoaderProps {
    auth0: Auth0Options;
    rootAppClientId: string;
    children: React.ReactNode;
}

const GET_CLIENT_ID = gql`
    query GetAuth0ClientId {
        tenancy {
            appClientId
        }
    }
`;

const AppClientIdLoader = ({ auth0, rootAppClientId, children }: AppClientIdLoaderProps) => {
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
            return (
                <AppClientIdLoader auth0={params.auth0} rootAppClientId={params.rootAppClientId}>
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
