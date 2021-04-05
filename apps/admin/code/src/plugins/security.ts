import cognitoSecurity from "@webiny/app-plugin-security-cognito";
import cognitoIdentityProvider from "@webiny/app-plugin-security-cognito/identityProvider";
import securityTenancy from "@webiny/app-security-tenancy/plugins";
import accountDetails from "@webiny/app-security-tenancy/plugins/userMenu/accountDetails";
import signOut from "@webiny/app-security-tenancy/plugins/userMenu/signOut";
import userImage from "@webiny/app-security-tenancy/plugins/userMenu/userImage";
import userInfo from "@webiny/app-security-tenancy/plugins/userMenu/userInfo";
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
     * Add Cognito password field to user views.
     */
    cognitoIdentityProvider(),
    /**
     * User menu plugins
     */
    accountDetails(),
    signOut(),
    userImage(),
    userInfo()
];
