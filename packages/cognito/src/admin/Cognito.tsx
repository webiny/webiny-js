import React, { Fragment, memo } from "react";
import { AdminUsers } from "@webiny/app-admin";
import { CognitoLogin, type CognitoLoginProps } from "./CognitoLogin.js";
import { useCognitoPasswordPolicy } from "./presentation/shared/usePasswordValidator.js";

export interface CognitoAdminProps {
    login: CognitoLoginProps;
}

const CognitoIdP = (props: CognitoAdminProps) => {
    const passwordPolicy = useCognitoPasswordPolicy();

    return (
        <Fragment>
            <CognitoLogin {...props.login} />
            <AdminUsers passwordPolicy={passwordPolicy} />
        </Fragment>
    );
};

export const CognitoAdmin = memo(CognitoIdP);
