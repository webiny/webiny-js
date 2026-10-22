import React from "react";
import { Fragment } from "react";
import { memo } from "react";
import { AdminUsers } from "@webiny/app-admin";
import { CognitoLogin } from "./CognitoLogin.js";
import type { CognitoLoginProps } from "./CognitoLogin.js";

export interface CognitoAdminProps {
    login: CognitoLoginProps;
}

/*
 * Email changes work in the default user pool, where users sign in with the `preferred_username`
 * alias that `UpdateUserUseCase` rewrites. A legacy pool that uses the email as the username
 * cannot follow, so it turns them off with `REACT_APP_ADMIN_USER_CAN_CHANGE_EMAIL=false`.
 */
const emailChangeable = process.env.REACT_APP_ADMIN_USER_CAN_CHANGE_EMAIL !== "false";

const CognitoIdP = (props: CognitoAdminProps) => {
    return (
        <Fragment>
            <CognitoLogin {...props.login} />
            <AdminUsers emailChangeable={emailChangeable} />
        </Fragment>
    );
};

export const CognitoAdmin = memo(CognitoIdP);
