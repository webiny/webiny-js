import React from "react";
import { useTenantContext } from "webiny/admin/tenancy";
import { CustomIdp } from "./CustomIdp";
import type { ApiError, LogoutReason } from "./types";

/**
 * This is automatically executed when there are no tokens present in the URL or localStorage.
 */
const useGoToLoginHook = () => {
    const { tenant } = useTenantContext();

    return () => {
        console.log("Go to login!");
        // Redirect to IDP login page.
        window.location.href = `http://localhost:3000/login?tenantId=${tenant}`;
    };
};

/**
 * This simply needs to issue an API call and return the new tokens.
 */
const useGetFreshTokensHook = () => {
    return (refreshToken: string) => {
        console.log("Refresh tokens");
        return fetch(`http://localhost:3000/refresh?token=${refreshToken}`, {
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(res => res.json())
            .then(json => {
                return {
                    idToken: json.idToken,
                    refreshToken: json.refreshToken
                };
            });
    };
};

/**
 * This is executed when a user is logged out of Webiny.
 */
const useOnLogoutHook = () => {
    return (reason?: LogoutReason) => {
        console.log("Logged out!", reason);
    };
};

/**
 * This is executed when an error is returned from the API.
 */
const useOnError = () => {
    const { tenant } = useTenantContext();

    return (error: ApiError) => {
        // Redirect to IDP login page.
        window.location.href = `http://localhost:3000/login?tenantId=${tenant}&error=${error.code}`;
    };
};

export const Extension = () => {
    return (
        <CustomIdp
            goToLogin={useGoToLoginHook}
            getFreshTokens={useGetFreshTokensHook}
            onLogout={useOnLogoutHook}
            onError={useOnError}
            refreshInterval={60}
        />
    );
};
