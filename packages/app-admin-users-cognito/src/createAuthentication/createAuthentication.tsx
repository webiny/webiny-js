import React, { useMemo, useState } from "react";
import { DocumentNode } from "graphql";
import {
    createAuthentication as baseCreateAuthentication,
    Config as BaseConfig
} from "@webiny/app-admin-cognito";
import { NotAuthorizedError } from "./NotAuthorizedError";
import { createGetIdentityData } from "~/createGetIdentityData";

export interface CreateAuthenticationConfig extends Partial<BaseConfig> {
    loginMutation?: DocumentNode;
}

export const createAuthentication = ({
    getIdentityData,
    ...config
}: CreateAuthenticationConfig = {}) => {
    const Authentication = ({ children, ...props }) => {
        const [error, setError] = useState(null);
        const BaseAuthentication = useMemo(() => {
            return baseCreateAuthentication({
                onError(error: Error) {
                    setError(error.message);
                },
                getIdentityData:
                    props.getIdentityData ||
                    getIdentityData ||
                    createGetIdentityData(config.loginMutation),
                ...config
            });
        }, []);

        if (error) {
            return <NotAuthorizedError />;
        }

        return <BaseAuthentication>{children}</BaseAuthentication>;
    };

    return Authentication;
};
