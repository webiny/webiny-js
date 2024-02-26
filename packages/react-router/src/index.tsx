import React, { useContext } from "react";
import {
    BrowserRouter as RBrowserRouter,
    BrowserRouterProps,
    UNSAFE_RouteContext as __RouterContext,
    useLocation,
    useParams,
    useSearchParams
} from "react-router-dom";
import { StaticRouter as RStaticRouter, StaticRouterProps } from "react-router-dom/server";
import { ReactRouterContext, RouterContext } from "./context/RouterContext";
/**
 * Webiny enhancements and backwards compatibility with react-router v5.
 */
import enhancer from "./routerEnhancer";
import { useHistory, UseHistory } from "~/useHistory";
import { RouteProps } from "./Route";

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

export * from "react-router-dom";

export { Link } from "./Link";
export type { LinkProps } from "./Link";

export { Route } from "./Route";
export type { RouteProps } from "./Route";

export { Prompt } from "./Prompt";
export type { PromptProps } from "./Prompt";

export { Routes } from "./Routes";
export { Routes as Switch } from "./Routes";
export type { RoutesProps } from "./Routes";

export { useHistory } from "./useHistory";
export type { UseHistory } from "./useHistory";

export { usePrompt } from "./usePrompt";

export type UseRouter = RouteProps &
    ReactRouterContext & {
        history: UseHistory;
        location: ReturnType<typeof useLocation>;
        params: Record<string, any>;
        search: ReturnType<typeof useSearchParams>;
    };

export function useRouter(): UseRouter {
    const history = useHistory();
    const location = useLocation();
    const params = useParams();
    const search = useSearchParams();
    return {
        ...useContext(RouterContext),
        ...useContext(__RouterContext),
        history,
        search,
        location,
        params
    };
}

/**
 * For Webiny, we only need a BrowserRouter, and we also export a StaticRouter, if we ever
 * need to do SSR. Right now, StaticRouter is not being used at all.
 */
export const BrowserRouter: React.ComponentType<BrowserRouterProps> = enhancer(RBrowserRouter);
export type { BrowserRouterProps };

export const StaticRouter: React.ComponentType<StaticRouterProps> = enhancer(RStaticRouter);
