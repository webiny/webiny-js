import adminTemplate from "@webiny/app-template-admin";
import "cross-fetch/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";
import React from "react";
import ReactDOM from "react-dom";
import "./App.scss";


const App = adminTemplate({
    cognito: {
        region: process.env.REACT_APP_USER_POOL_REGION,
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
    },
    apolloClient: {
        uri: process.env.REACT_APP_GRAPHQL_API_URL
    },
    defaultRoute: "/page-builder/pages"
});

ReactDOM.render(<App />, document.getElementById("root"));
