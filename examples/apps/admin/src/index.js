import adminTemplate from "@webiny/app-template-admin";
import "./App.scss";

export const App = adminTemplate({
    cognito: {
        region: process.env.REACT_APP_USER_POOL_REGION,
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
    },
    apolloClient: {
        uri: process.env.REACT_APP_GRAPHQL_API_URL
    }
});
