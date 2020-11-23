import cognitoSecurity from "@webiny/app-plugin-security-cognito";
import cognitoUserManagement from "@webiny/app-plugin-security-cognito/userManagement";
import securityTenancy from "@webiny/app-security-tenancy/plugins";
import { getIdentityData } from "../components/getIdentityData";

export default [
    /**
     * Configures Amplify, adds "app-installer-security" and "apollo-link" plugins.
     */
    cognitoSecurity({
        region: process.env.REACT_APP_USER_POOL_REGION,
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
        getIdentityData
    }),
    /**
     * Add user management module to admin app.
     */
    securityTenancy(),
    /**
     * Add Cognito password field to user management views.
     */
    cognitoUserManagement()
];
