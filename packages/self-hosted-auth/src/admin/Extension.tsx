import React from "react";
import { SelfHostedLogin } from "./SelfHostedLogin.js";

/*
 * Resolve the GraphQL endpoint the login mutation is sent to. Mirrors the admin app's own URL
 * resolution: the configured API URL wins (baked by `<Admin.ApiUrl>` into WEBINY_ADMIN_API_URL),
 * otherwise same-origin `/graphql` (deployed self-hosted admin served behind the same domain as
 * the API).
 */
const resolveGraphqlUrl = (): string => {
    const configuredApiUrl = process.env.WEBINY_ADMIN_API_URL;
    if (configuredApiUrl && configuredApiUrl !== "undefined") {
        return `${configuredApiUrl}/graphql`;
    }
    if (typeof window !== "undefined") {
        return `${window.location.origin}/graphql`;
    }
    return "/graphql";
};

export const Extension = () => {
    return <SelfHostedLogin graphqlUrl={resolveGraphqlUrl()} />;
};
