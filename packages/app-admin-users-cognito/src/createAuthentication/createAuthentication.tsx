import React, { useMemo, useState } from "react";
import { DocumentNode } from "graphql";
import {
    createAuthentication as baseCreateAuthentication,
    AuthenticationFactoryConfig as BaseConfig
} from "@webiny/app-admin-cognito";
import { NotAuthorizedError } from "./NotAuthorizedError";
import { createGetIdentityData, LOGIN_ST, LOGIN_MT } from "~/createGetIdentityData";
import { useTenancy, withTenant } from "@webiny/app-tenancy";
import { GetIdentityDataCallable } from "~/createGetIdentityData/createGetIdentityData";

export interface CreateAuthenticationConfig extends Partial<BaseConfig> {
    loginMutation?: DocumentNode;
}

interface WithGetIdentityDataProps {
    getIdentityData: GetIdentityDataCallable;
    children: React.ReactNode;
}

interface AuthenticationProps {
    getIdentityData: GetIdentityDataCallable;
    children: React.ReactNode;
}

export const createAuthentication = (config: CreateAuthenticationConfig = {}) => {
    const withGetIdentityData = (Component: React.VFC<WithGetIdentityDataProps>) => {
        const WithGetIdentityData: React.VFC<WithGetIdentityDataProps> = ({ children }) => {
            const { isMultiTenant } = useTenancy();
            const loginMutation = config.loginMutation || (isMultiTenant ? LOGIN_MT : LOGIN_ST);
            const getIdentityData = config.getIdentityData || createGetIdentityData(loginMutation);
            /**
             * TODO @ts-refactor
             * createGetIdentityData return function does not have payload param so TS is complaining.
             * createGetIdentityData does not need the payload param
             */
            // @ts-ignore
            return <Component getIdentityData={getIdentityData}>{children}</Component>;
        };

        return WithGetIdentityData;
    };

    const Authentication: React.VFC<AuthenticationProps> = ({ getIdentityData, children }) => {
        const [error, setError] = useState<string | null>(null);
        const BaseAuthentication = useMemo(() => {
            return baseCreateAuthentication({
                onError(error: Error) {
                    setError(error.message);
                },
                getIdentityData,
                ...config
            });
        }, []);

        if (error) {
            return <NotAuthorizedError />;
        }

        return <BaseAuthentication>{children}</BaseAuthentication>;
    };

    return withGetIdentityData(withTenant(Authentication));
};
