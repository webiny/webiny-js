import React, { useMemo, useState } from "react";
import type { AuthenticationFactoryConfig as BaseConfig } from "@webiny/app-admin-cognito";
import { createAuthentication as baseCreateAuthentication } from "@webiny/app-admin-cognito";
import { useTags } from "@webiny/app-admin";
import { NotAuthorizedError } from "./NotAuthorizedError/index.js";

export interface CreateAuthenticationConfig extends Partial<BaseConfig> {}

interface AuthenticationProps {
    children: React.ReactNode;
}

export const createAuthentication = (config: CreateAuthenticationConfig = {}) => {
    const Authentication = ({ children }: AuthenticationProps) => {
        const { installer } = useTags();
        const [error, setError] = useState<string | null>(null);
        const BaseAuthentication = useMemo(() => {
            return baseCreateAuthentication({
                onError(error: Error) {
                    setError(error.message);
                },
                ...config
            });
        }, []);

        if (error && !installer) {
            return <NotAuthorizedError />;
        }

        return <BaseAuthentication>{children}</BaseAuthentication>;
    };

    return Authentication;
};
