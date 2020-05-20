import adminTemplate from "@webiny/app-template-admin";
import { CmsProvider } from "@webiny/app-headless-cms/admin/contexts/Cms";
import headlessCmsPlugins from "@webiny/app-headless-cms/admin/plugins";
import "./App.scss";
import React from "react";

export default adminTemplate({
    cognito: {
        region: process.env.REACT_APP_USER_POOL_REGION,
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
    },
    plugins: [
        {
            type: "app-template-renderer",
            name: "app-template-renderer-headless-cms",
            render(children) {
                return <CmsProvider>{children}</CmsProvider>;
            }
        },
        headlessCmsPlugins()
    ]
});
