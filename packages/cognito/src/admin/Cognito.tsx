import React from "react";
import { Fragment } from "react";
import { memo } from "react";
import { AdminUsers } from "@webiny/app-admin";
import { CognitoLogin } from "./CognitoLogin.js";
import type { CognitoLoginProps } from "./CognitoLogin.js";

export interface CognitoAdminProps {
    login: CognitoLoginProps;
}

const CognitoIdP = (props: CognitoAdminProps) => {
    return (
        <Fragment>
            <CognitoLogin {...props.login} />
            <AdminUsers />
        </Fragment>
    );
};

export const CognitoAdmin = memo(CognitoIdP);
