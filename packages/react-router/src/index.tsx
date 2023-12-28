import React from "react";
import { useLocation, useParams, useSearchParams, useNavigate } from "react-router-dom";
export { useLocation, useParams, useSearchParams, useNavigate };
/**
 * Webiny enhancements and backwards compatibility with react-router v5.
 */
import { BrowserRouter as WebinyRouter, BrowserRouterProps } from "./BrowserRouter";
import { useHistory, UseHistory } from "~/useHistory";

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

export type UseRouter = {
    navigate: ReturnType<typeof useNavigate>;
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
    const navigate = useNavigate();

    return {
        navigate,
        history,
        search,
        location,
        params
    };
}

/**
 * We have a custom version of the BrowserRouter, with the ability to provide our own instance of `History`.
 */
export const BrowserRouter: React.FC<BrowserRouterProps> = WebinyRouter;
export type { BrowserRouterProps };
export { Router, RouteContent, RouteDefinition } from "./Router";
