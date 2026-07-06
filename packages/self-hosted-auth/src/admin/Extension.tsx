import React from "react";
import { SelfHostedLogin } from "./SelfHostedLogin.js";

/*
 * Resolve the GraphQL endpoint the login mutation is sent to. Mirrors the admin app's own URL
 * resolution: the build/watch-time env var wins (set for local `watch`), otherwise same-origin
 * `/graphql` (deployed self-hosted admin served behind the same domain as the API).
 */
const resolveGraphqlUrl = (): string => {
    if (process.env.REACT_APP_GRAPHQL_API_URL) {
        return process.env.REACT_APP_GRAPHQL_API_URL;
    }
    if (typeof window !== "undefined") {
        return `${window.location.origin}/graphql`;
    }
    return "/graphql";
};

export const Extension = () => {
    return <SelfHostedLogin graphqlUrl={resolveGraphqlUrl()} />;
};
