import cognitoSecurity from "@webiny/app-plugin-security-cognito";
import cognitoUserManagement from "@webiny/app-plugin-security-cognito/userManagement";
import userManagement from "@webiny/app-security-user-management/plugins";
import { getIdentityData } from "../components/getIdentityData";

export default [
    /**
     * Configures Amplify, adds "app-installer-security" and "apollo-link" plugin.
     */
    cognitoSecurity({
        region: process.env.REACT_APP_USER_POOL_REGION,
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
        getIdentityData
    }),
    userManagement(),
    cognitoUserManagement()
];
