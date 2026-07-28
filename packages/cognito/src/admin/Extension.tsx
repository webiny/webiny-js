import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { CognitoFeature } from "./presentation/Cognito/feature.js";
import { CognitoBreadcrumbsFeature } from "./breadcrumbs/feature.js";
import { CognitoAdmin } from "./Cognito.js";
import { CognitoPermissionsFeature } from "./features/permissions/feature.js";
import { GetCurrentUserFeature } from "./features/account/getCurrentUser/index.js";
import { UpdateCurrentUserFeature } from "./features/account/updateCurrentUser/index.js";
import { ListUsersFeature } from "./features/users/listUsers/index.js";
import { GetUserFeature } from "./features/users/getUser/index.js";
import { CreateUserFeature } from "./features/users/createUser/index.js";
import { UpdateUserFeature } from "./features/users/updateUser/index.js";
import { DeleteUserFeature } from "./features/users/deleteUser/index.js";

export const Extension = () => {
    const region = process.env.REACT_APP_USER_POOL_REGION || "";
    const userPoolId = process.env.REACT_APP_USER_POOL_ID || "";
    const clientId = process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID || "";

    return (
        <>
            <RegisterFeature feature={CognitoBreadcrumbsFeature} />
            <RegisterFeature feature={CognitoFeature} />
            <RegisterFeature feature={CognitoPermissionsFeature} />
            <RegisterFeature feature={GetCurrentUserFeature} />
            <RegisterFeature feature={UpdateCurrentUserFeature} />
            <RegisterFeature feature={ListUsersFeature} />
            <RegisterFeature feature={GetUserFeature} />
            <RegisterFeature feature={CreateUserFeature} />
            <RegisterFeature feature={UpdateUserFeature} />
            <RegisterFeature feature={DeleteUserFeature} />
            <CognitoAdmin
                login={{
                    region,
                    userPoolId,
                    clientId
                }}
            />
        </>
    );
};
