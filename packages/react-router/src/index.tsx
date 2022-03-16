import React, { useContext } from "react";
import {
    BrowserRouter as RBrowserRouter,
    BrowserRouterProps,
    RouteProps as RouteChildrenProps,
    UNSAFE_RouteContext as __RouterContext,
    useNavigate,
    useLocation,
    useMatch
} from "react-router-dom";
import { Location, To } from "history";
import { StaticRouter as RStaticRouter, StaticRouterProps } from "react-router-dom/server";
import { RouterContext, ReactRouterContextValue } from "./context/RouterContext";

export * from "react-router-dom";

export { Link } from "./Link";
export type { LinkProps } from "./Link";
export { Route } from "./Route";
export type { RouteProps } from "./Route";
export { Prompt } from "./Prompt";
export type { PromptProps } from "./Prompt";

export type UseRouter = RouteChildrenProps &
    ReactRouterContextValue & {
        history: UseHistory;
        location: Location;
        match: PathMatch<any> | null;
    };

interface UseHistory {
    push: (to: To, options?: NavigateOptions) => void;
}
export const useHistory = (): UseHistory => {
    const navigate = useNavigate();

    return {
        push: (to, options) => {
            return navigate(to, options);
        }
    };
};

export function useRouter(): UseRouter {
    // TODO make sure this works
    console.log("!CHECK HERE!");
    const location = useLocation();
    return {
        ...useContext(RouterContext),
        ...useContext(__RouterContext),
        history: useHistory(),
        location,
        match: useMatch(location.search)
    };
}

import enhancer from "./routerEnhancer";
import { NavigateOptions, PathMatch } from "react-router";
export const BrowserRouter: React.FC<BrowserRouterProps> = enhancer(RBrowserRouter);
export const StaticRouter: React.FC<StaticRouterProps> = enhancer(RStaticRouter);
