// @flow
export type { Plugin } from "webiny-app/plugins";
export type { WithRouterProps } from "webiny-app/components";
export type { Redux } from "webiny-app/redux";

// Redux types
export type Action = {
    type: string,
    payload: Object
};

export type ActionOptions = {
    log?: boolean
};

export type StatePath = null | string | (action: Action) => string;

export type Reducer = Function;

export type ReducerFactory = () => Reducer;

export type Store = {
    dispatch: Function,
    getState: Function
};

export type State = Object;

export type MiddlewareParams = {
    store: Store,
    next: Function,
    action: Action
};

export type MiddlewareFunction = MiddlewareParams => any;
export type ActionCreator = (payload?: Object) => Action;

// Security types

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
