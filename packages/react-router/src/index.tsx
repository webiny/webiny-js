import React, { useContext } from "react";
import {
    BrowserRouter as RBrowserRouter,
    BrowserRouterProps,
    RouteProps as RouteChildrenProps,
    UNSAFE_RouteContext as __RouterContext,
    useLocation,
    useParams,
    Location
} from "react-router-dom";
import { StaticRouter as RStaticRouter, StaticRouterProps } from "react-router-dom/server";
import { RouterContext, ReactRouterContextValue } from "./context/RouterContext";

import enhancer from "./routerEnhancer";
import { useHistory, UseHistory } from "~/useHistory";

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

export interface UseRouter extends RouteChildrenProps, ReactRouterContextValue {
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

export const BrowserRouter: React.FC<BrowserRouterProps> = enhancer(RBrowserRouter);
export const StaticRouter: React.FC<StaticRouterProps> = enhancer(RStaticRouter);
