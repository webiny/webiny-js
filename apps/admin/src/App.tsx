import {CognitoViewLogoPlugin} from "@webiny/app-plugin-security-cognito-theme/admin/types";
import adminTemplate from "@webiny/app-template-admin-full";
import "./App.scss";

export default adminTemplate({
    cognito: {
        region: process.env.REACT_APP_USER_POOL_REGION,
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
    },
    plugins: [
        {
            type: "cognito-view",
            name: "cognito-view-logo",
            src: "some_string.jpg",
        } as CognitoViewLogoPlugin,
    ],
});
