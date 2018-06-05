import type { Axios } from "axios";

export type AuthenticationServiceConfig = {
    header: string,
    cookie: string | Function,
    url: string,
    fields: string,
    me: () => Axios,
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
