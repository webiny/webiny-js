/// <reference types="react" />
import { RouteChildrenProps } from "react-router-dom";
import { ReactRouterContextValue } from "./context/RouterContext";
export * from "react-router-dom";
export { Link } from "./Link";
export declare type UseRouter = RouteChildrenProps & ReactRouterContextValue;
export declare function useRouter(): UseRouter;
export declare const BrowserRouter: (props: any) => JSX.Element;
export declare const StaticRouter: (props: any) => JSX.Element;
