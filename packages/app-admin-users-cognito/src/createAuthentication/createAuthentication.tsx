import React, { useMemo, useState } from "react";
import type { DocumentNode } from "graphql";
import type { AuthenticationFactoryConfig as BaseConfig } from "@webiny/app-admin-cognito";
import { createAuthentication as baseCreateAuthentication } from "@webiny/app-admin-cognito";
import { useTags } from "@webiny/app-admin";
import { withTenant } from "@webiny/app-admin";
import { NotAuthorizedError } from "./NotAuthorizedError/index.js";
import { createGetIdentityData, LOGIN } from "~/createGetIdentityData/index.js";
import type { GetIdentityDataCallable } from "~/createGetIdentityData/createGetIdentityData.js";

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
    const withGetIdentityData = (Component: React.ComponentType<WithGetIdentityDataProps>) => {
        const WithGetIdentityData = ({
            children
        }: Omit<WithGetIdentityDataProps, "getIdentityData">) => {
            const loginMutation = config.loginMutation || LOGIN;
            const getIdentityData = config.getIdentityData || createGetIdentityData(loginMutation);
            /**
             * TODO @ts-refactor
             * createGetIdentityData return function does not have payload param so TS is complaining.
             * createGetIdentityData does not need the payload param
             */
            // @ts-expect-error
            return <Component getIdentityData={getIdentityData}>{children}</Component>;
        };

        return WithGetIdentityData;
    };

    const Authentication = ({ getIdentityData, children }: AuthenticationProps) => {
        const { installer } = useTags();
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

        if (error && !installer) {
            return <NotAuthorizedError />;
        }

        return <BaseAuthentication>{children}</BaseAuthentication>;
    };

    return withGetIdentityData(withTenant(Authentication));
};
