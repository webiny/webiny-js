import React, { FC, Fragment, useEffect, useRef, useState } from "react";
import { OktaAuth } from "@okta/okta-auth-js";
import OktaSignIn from "@okta/okta-signin-widget";
import get from "lodash/get";
import { Compose, LoginScreenRenderer, useTenancy } from "@webiny/app-serverless-cms";
import { createAuthentication } from "./createAuthentication";
import { UserMenuModule } from "~/modules/userMenu";
import { AppClientModule } from "~/modules/appClient";
import { useApolloClient } from "@apollo/react-hooks";
import gql from "graphql-tag";

interface AppClientIdLoaderProps {
    oktaFactory: OktaFactory;
    rootAppClientId: string;
}

const GET_CLIENT_ID = gql`
    query GetOktaClientId {
        tenancy {
            appClientId
        }
    }
`;

const AppClientIdLoader: FC<AppClientIdLoaderProps> = ({
    oktaFactory,
    rootAppClientId,
    children
}) => {
    const [loaded, setState] = useState<boolean>(false);
    const authRef = useRef<React.FC | null>(null);
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
            console.info(`Configuring Okta with App Client Id "${rootAppClientId}"`);
            authRef.current = createAuthentication({
                ...oktaFactory({ clientId: rootAppClientId }),
                clientId: rootAppClientId
            });
            setState(true);
            return;
        }

        client.query({ query: GET_CLIENT_ID }).then(({ data }) => {
            const clientId = get(data, "tenancy.appClientId");
            if (clientId) {
                console.info(`Configuring Okta with App Client Id "${clientId}"`);
                authRef.current = createAuthentication({ ...oktaFactory({ clientId }), clientId });
                setState(true);
            } else {
                console.warn(`Couldn't load appClientId for tenant "${tenantId}"`);
            }
        });
    }, []);

    return loaded ? React.createElement(authRef.current as React.FC, {}, children) : null;
};

const createLoginScreen = (params: OktaProps) => {
    return function OktaLoginScreenHOC(): React.FC {
        return function OktaLoginScreen({ children }) {
            return (
                <AppClientIdLoader
                    oktaFactory={params.factory}
                    rootAppClientId={params.rootAppClientId}
                >
                    {children}
                </AppClientIdLoader>
            );
        };
    };
};

interface OktaFactoryParams {
    clientId: string;
}

export interface OktaSDK {
    oktaSignIn: OktaSignIn;
    oktaAuth: OktaAuth;
}

export interface OktaFactory {
    (params: OktaFactoryParams): OktaSDK;
}

export interface OktaProps {
    rootAppClientId: string;
    factory: OktaFactory;
    children?: React.ReactNode;
}

export const Okta: React.FC<OktaProps> = props => {
    /**
     * TODO @ts-refactor
     * Figure correct type for Compose.component
     */
    return (
        <Fragment>
            <Compose component={LoginScreenRenderer} with={createLoginScreen(props)} />
            <UserMenuModule />
            <AppClientModule />
        </Fragment>
    );
};
