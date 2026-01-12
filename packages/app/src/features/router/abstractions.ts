import { Abstraction } from "@webiny/di";
import type { Route, RouteParamsDefinition, RouteParamsInfer } from "./Route.js";
import type { RequiredKeysOf } from "type-fest";

/***** Presenter *****/

export type RouteParamsArgs<TParams extends RouteParamsDefinition | undefined> =
    TParams extends RouteParamsDefinition
        ? RequiredKeysOf<RouteParamsInfer<TParams>> extends never
            ? [params?: RouteParamsInfer<TParams>] // all optional → param optional
            : [params: RouteParamsInfer<TParams>] // some required → param required
        : [];

interface RouterViewModel {
    currentRoute: MatchedRoute | undefined;
}

export interface IRouterPresenter {
    vm: RouterViewModel;
    bootstrap(routes: Route[]): void;
    goToRoute<TParams extends RouteParamsDefinition | undefined>(
        route: Route<TParams>,
        ...args: RouteParamsArgs<TParams>
    ): void;
    getLink<TParams extends RouteParamsDefinition | undefined>(
        route: Route<TParams>,
        ...args: RouteParamsArgs<TParams>
    ): string;
    setRouteParams<T extends Record<string, any>>(cb: (params: T) => T): void;
    onRouteExit(cb: OnRouteExit): void;
    destroy(): void;
}
export const RouterPresenter = new Abstraction<IRouterPresenter>("RouterPresenter");

export namespace RouterPresenter {
    export type Interface = IRouterPresenter;
}

/***** Repository *****/

export interface MatchedRoute<TParams = Record<string, any>> {
    // Name of the matched route.
    name: string;
    // Pathname that was used to match the route.
    pathname: string;
    // Path pattern that matched this route.
    path: string;
    // Route params extracted from the pathname.
    params: TParams;
}

interface IRouterRepository {
    onRouteExit(cb: OnRouteExit): void;

    getMatchedRoute(): MatchedRoute | undefined;

    getCurrentRoute(): Route<any> | undefined;

    goToRoute<TParams extends RouteParamsDefinition | undefined>(
        route: Route<TParams>,
        params: TParams extends RouteParamsDefinition ? RouteParamsInfer<TParams> : undefined
    ): void;

    getLink<TParams extends RouteParamsDefinition | undefined>(
        route: Route<TParams>,
        params: TParams extends RouteParamsDefinition ? RouteParamsInfer<TParams> : undefined
    ): string;

    registerRoutes(routes: Route[]): void;

    destroy(): void;
}

export const RouterRepository = new Abstraction<IRouterRepository>("RouterRepository");

export namespace RouterRepository {
    export type Interface = IRouterRepository;
}

/***** Gateway *****/

export interface RouteDefinition {
    name: string;
    path: string;
    onMatch(route: MatchedRoute): void;
}

export type TransitionController = {
    continue: () => void;
    cancel: () => void;
};

export interface OnRouteExit {
    (controller: TransitionController): void;
}

interface IRouterGateway {
    setRoutes(routes: RouteDefinition[]): void;
    addRoute(route: RouteDefinition): void;
    goToRoute(name: string, params?: { [k: string]: any }): void;
    pushState(url: string): void;
    onRouteExit(cb: OnRouteExit): void;
    destroy(): void;
}

export const RouterGateway = new Abstraction<IRouterGateway>("RouterGateway");

export namespace RouterGateway {
    export type Interface = IRouterGateway;
}
