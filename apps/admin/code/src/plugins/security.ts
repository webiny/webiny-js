import security from "@webiny/app-plugin-security-cognito";
import cognitoUserManagement from "@webiny/app-plugin-security-cognito/userManagement";
import userManagement from "@webiny/app-security-user-management/plugins";
import { LOGIN } from "@webiny/app-security-user-management/graphql";

export default [
    security({
        region: process.env.REACT_APP_USER_POOL_REGION,
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
        async getIdentityData({ client }) {
            const { data } = await client.mutate({ mutation: LOGIN });
            return data.security.login.data;
        }
    }),
    userManagement(),
    cognitoUserManagement()
];
