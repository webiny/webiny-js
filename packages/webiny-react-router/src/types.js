// @flow
export type Route = {
    name: string,
    path: string,
    params?: []
} & Object;

export type GoToRouteOptions = {
    params?: Object,
    merge?: boolean,
    name?: string
} & Object;

export type RouterConfig = {
    defaultRoute: string,
    history: any,
    basename: string,
    middleware: Array<Function>
};
