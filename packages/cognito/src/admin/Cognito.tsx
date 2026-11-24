import React from "react";
import { Fragment } from "react";
import { memo } from "react";
import { AdminUsers } from "@webiny/app-admin";
import { CognitoLogin } from "./CognitoLogin.js";
import type { CognitoLoginProps } from "./CognitoLogin.js";

/**
 * A Cognito account is shared by all of the person's tenants, and Cognito can drop a user's TOTP
 * token, so both are on.
 */
const ADMIN_USERS_CAPABILITIES = { linkAccounts: true, resetMfa: true };

export interface CognitoAdminProps {
    login: CognitoLoginProps;
}

const CognitoIdP = (props: CognitoAdminProps) => {
    return (
        <Fragment>
            <CognitoLogin {...props.login} />
            <AdminUsers capabilities={ADMIN_USERS_CAPABILITIES} />
        </Fragment>
    );
};

export const CognitoAdmin = memo(CognitoIdP);
