import React, { useContext } from "react";
import {
    BrowserRouter as RBrowserRouter,
    BrowserRouterProps,
    UNSAFE_RouteContext as __RouterContext,
    useLocation,
    useParams,
    Location
} from "react-router-dom";
import { StaticRouter as RStaticRouter, StaticRouterProps } from "react-router-dom/server";
import { RouterContext, ReactRouterContext } from "./context/RouterContext";

/**
 * Re-export types from react-router-dom.
 */
export type {
    // "react-router" types
    Hash,
    Location,
    Path,
    To,
    MemoryRouterProps,
    NavigateFunction,
    NavigateOptions,
    NavigateProps,
    Navigator,
    OutletProps,
    Params,
    PathMatch,
    RouteMatch,
    RouteObject,
    PathRouteProps,
    LayoutRouteProps,
    IndexRouteProps,
    RouterProps,
    Pathname,
    Search,
    // "react-router-dom" types
    ParamKeyValuePair,
    URLSearchParamsInit
} from "react-router-dom";

/**
 * Webiny enhancements and backwards compatibility with react-router v5.
 */
import enhancer from "./routerEnhancer";
import { useHistory, UseHistory } from "~/useHistory";

export * from "react-router-dom";

export { Link } from "./Link";
export type { LinkProps } from "./Link";

export { Route } from "./Route";
import { RouteProps } from "./Route";
export type { RouteProps } from "./Route";

export { Prompt } from "./Prompt";
export type { PromptProps } from "./Prompt";

export { Routes } from "./Routes";
export { Routes as Switch } from "./Routes";
export type { RoutesProps } from "./Routes";

export { useHistory } from "./useHistory";
export type { UseHistory } from "./useHistory";

export { usePrompt } from "./usePrompt";

export interface UseRouter extends RouteProps, ReactRouterContext {
    history: UseHistory;
    location: Location;
    params: Record<string, any>;
}

export function useRouter(): UseRouter {
    const location = useLocation();
    return {
        ...useContext(RouterContext),
        ...useContext(__RouterContext),
        history: useHistory(),
        location,
        params: useParams()
    };
}

/**
 * For Webiny, we only need a BrowserRouter, and we also export a StaticRouter, if we ever
 * need to do SSR. Right now, StaticRouter is not being used at all.
 */
export const BrowserRouter: React.FC<BrowserRouterProps> = enhancer(RBrowserRouter);
export type { BrowserRouterProps };

export const StaticRouter: React.FC<StaticRouterProps> = enhancer(RStaticRouter);
