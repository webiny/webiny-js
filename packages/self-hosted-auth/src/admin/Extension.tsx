import React from "react";
import { resolveGraphqlUrl } from "@webiny/app-admin/base/resolveApiUrl.js";
import { SelfHostedLogin } from "./SelfHostedLogin.js";

/*
 * The login screen renders before the user is authenticated, so it can't read the endpoint off
 * EnvConfig the way the rest of the app does: it sends its mutation itself rather than through the
 * container's GraphQL client. It uses the admin's own resolver rather than a second copy of the
 * rules, so a relative API URL (what the dev proxy bakes in) resolves the same way in both.
 */
export const Extension = () => {
    return <SelfHostedLogin graphqlUrl={resolveGraphqlUrl()} />;
};
