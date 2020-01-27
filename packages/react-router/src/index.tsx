import React from "react";

import { BrowserRouter as RBrowserRouter, StaticRouter as RStaticRouter } from "react-router-dom";
import { withRouter as RWithRouter, RouteComponentProps } from "react-router";
import { RouterConsumer } from "./context/RouterContext";

export * from "react-router-dom";

export { Link } from "./Link";

export type WithRouterProps<TProps> = TProps &
    RouteComponentProps & {
        onLink(link: string): void;
    };

export function withRouter<T extends {}>(
    BaseComponent
): React.ComponentType<Omit<T, keyof WithRouterProps<{}>>> {
    // eslint-disable-next-line react/display-name
    return RWithRouter(props => (
        <RouterConsumer>
            <BaseComponent {...props} />
        </RouterConsumer>
    ));
}

import enhancer from "./routerEnhancer";
export const BrowserRouter = enhancer(RBrowserRouter);
export const StaticRouter = enhancer(RStaticRouter);
