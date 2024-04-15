import React from "react";
import { Website } from "@webiny/app-website";
import { configureWebsiteSecurity, createRoutes } from "@demo/website";

const WebsiteSecurity = configureWebsiteSecurity();

export const App = () => {
    return <Website providers={[WebsiteSecurity]} routes={createRoutes()} />;
};
