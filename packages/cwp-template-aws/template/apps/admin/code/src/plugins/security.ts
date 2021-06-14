import cognitoSecurity from "@webiny/app-security-admin-users-cognito";
import adminUsers from "@webiny/app-security-admin-users/plugins";
import accountDetails from "@webiny/app-security-admin-users/plugins/userMenu/accountDetails";
import signOut from "@webiny/app-security-admin-users/plugins/userMenu/signOut";
import userImage from "@webiny/app-security-admin-users/plugins/userMenu/userImage";
import userInfo from "@webiny/app-security-admin-users/plugins/userMenu/userInfo";
import { getIdentityData } from "../components/getIdentityData";

export default [
    /**
     * Configure Amplify, add Cognito related UI fields, and attach Authorization header
     * on every GraphQL request using the authenticated identity.
     */
    cognitoSecurity({
        region: process.env.REACT_APP_USER_POOL_REGION,
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
        getIdentityData
    }),
    /**
     * User management module (Users, Groups, API Keys).
     */
    adminUsers(),
    /**
     * User menu plugins.
     */
    accountDetails(),
    signOut(),
    userImage(),
    userInfo()
];
