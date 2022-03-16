import React, { useContext } from "react";
import {
    BrowserRouter as RBrowserRouter,
    BrowserRouterProps,
    RouteProps as RouteChildrenProps,
    UNSAFE_RouteContext as __RouterContext
} from "react-router-dom";
import { StaticRouter as RStaticRouter, StaticRouterProps } from "react-router-dom/server";
import { RouterContext, ReactRouterContextValue } from "./context/RouterContext";

export * from "react-router-dom";

export { Link } from "./Link";
export type { LinkProps } from "./Link";
export { Route } from "./Route";
export type { RouteProps } from "./Route";
export { Prompt } from "./Prompt";
export type { PromptProps } from "./Prompt";
export { Routes } from "./Routes";
export type { RoutesProps } from "./Routes";
export { useHistory } from "./useHistory";
export type { UseHistory } from "./useHistory";

export type UseRouter = RouteChildrenProps & ReactRouterContextValue;

export function useRouter(): UseRouter {
    return {
        ...useContext(RouterContext),
        ...useContext(__RouterContext)
    };
}

import enhancer from "./routerEnhancer";
export const BrowserRouter: React.FC<BrowserRouterProps> = enhancer(RBrowserRouter);
export const StaticRouter: React.FC<StaticRouterProps> = enhancer(RStaticRouter);
