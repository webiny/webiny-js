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
    replaceRouteParams<T extends Record<string, any>>(cb: (params: T) => T): void;
    goBack(): void;
    addTransitionGuard(config: RouteTransitionGuardConfig): GuardDisposer;
    isTransitionBlocked(): boolean;
    unblockTransition(): void;
    confirmTransition(): void;
    cancelTransition(): void;
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

export interface IRouterRepository {
    getMatchedRoute(): MatchedRoute | undefined;

    getCurrentRoute(): Route<any> | undefined;

    goToRoute<TParams extends RouteParamsDefinition | undefined>(
        route: Route<TParams>,
        params: TParams extends RouteParamsDefinition ? RouteParamsInfer<TParams> : undefined
    ): void;

    replaceRoute<TParams extends RouteParamsDefinition | undefined>(
        route: Route<TParams>,
        params: TParams extends RouteParamsDefinition ? RouteParamsInfer<TParams> : undefined
    ): void;

    getLink<TParams extends RouteParamsDefinition | undefined>(
        route: Route<TParams>,
        params: TParams extends RouteParamsDefinition ? RouteParamsInfer<TParams> : undefined
    ): string;

    goBack(): void;

    registerRoutes(routes: Route[]): void;

    addGuard(config: RouteTransitionGuardConfig): GuardDisposer;
    isBlocked(): boolean;
    unblock(): void;
    confirmTransition(): void;
    cancelTransition(): void;

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

interface IRouterGateway {
    setRoutes(routes: RouteDefinition[]): void;
    goToRoute(name: string, params?: { [k: string]: any }): void;
    replaceRoute(name: string, params?: { [k: string]: any }): void;
    goBack(): void;
    pushState(url: string): void;
    replaceState(url: string): void;
    addGuard(config: RouteTransitionGuardConfig): GuardDisposer;
    destroy(): void;
}

export const RouterGateway = new Abstraction<IRouterGateway>("RouterGateway");

export namespace RouterGateway {
    export type Interface = IRouterGateway;
}

/***** Route Transition *****/

export type GuardDisposer = () => void;

export interface RouteTransitionGuardConfig {
    /** Return true to block the transition. */
    guard: () => boolean;
    /** Called when this guard blocks a transition. Show a confirmation dialog here. */
    onBlocked: (controller: TransitionController) => void;
}
