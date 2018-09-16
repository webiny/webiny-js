// @flow
export type { Plugin } from "webiny-app/plugins";
export type { WithRouterProps } from "webiny-app/components";

// TODO: decide what to do with security in general

export type AuthenticationServiceConfig = {
    onLogout?: () => Promise<any>,
    header: string,
    cookie: string | Function,
    url: string,
    fields: string,
    me: () => *,
    identities: Array<{
        identity: string,
        authenticate: Array<{
            strategy: string,
            apiMethod: string,
            cookie?: {
                path: string,
                expiration: string
            }
        }>
    }>
};
