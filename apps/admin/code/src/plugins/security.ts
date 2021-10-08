import security from "@webiny/app-security";
import adminUsersCognito from "@webiny/app-admin-users-cognito";
import accountDetails from "@webiny/app-admin-users-cognito/userMenu/accountDetails";
import signOut from "@webiny/app-admin-users-cognito/userMenu/signOut";
import userImage from "@webiny/app-admin-users-cognito/userMenu/userImage";
import userInfo from "@webiny/app-admin-users-cognito/userMenu/userInfo";
import { getIdentityData } from "../components/getIdentityData";

export default [
    security(),
    /**
     * Add user management module to admin app.
     * Configures Amplify Auth and attaches Authorization header on every 
     * GraphQL request using the authenticated identity.
     */
    adminUsersCognito({
        region: process.env.REACT_APP_USER_POOL_REGION,
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
        getIdentityData
    }),

    /**
     * User menu plugins
     */
    accountDetails(),
    signOut(),
    userImage(),
    userInfo()
];
