import React from "react";
import { Fragment } from "react";
import { memo } from "react";
import { useMemo } from "react";
import { AdminUsers } from "@webiny/app-admin";
import { CognitoLogin } from "./CognitoLogin.js";
import type { CognitoLoginProps } from "./CognitoLogin.js";
import { getCognitoPasswordPolicy } from "./presentation/shared/getCognitoPasswordPolicy.js";

export interface CognitoAdminProps {
    login: CognitoLoginProps;
}

const CognitoIdP = (props: CognitoAdminProps) => {
    // Read once: `AdminUsers` registers the policy again whenever this object changes.
    const passwordPolicy = useMemo(getCognitoPasswordPolicy, []);

    return (
        <Fragment>
            <CognitoLogin {...props.login} />
            <AdminUsers passwordPolicy={passwordPolicy} />
        </Fragment>
    );
};

export const CognitoAdmin = memo(CognitoIdP);
