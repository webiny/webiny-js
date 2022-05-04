/**
 * TODO: remove at some point and use the one from react-router-dom directly.
 * This component is for backwards compatibility with react-router v5, to avoid codemods on existing Webiny projects.
 */
import React from "react";
import { Route as BaseRoute, RouteProps as BaseRouteProps, useLocation } from "react-router-dom";
import { Location } from "history";

interface RoutePropsRenderParams {
    location: Location;
}

export interface RouteProps extends BaseRouteProps {
    /**
     * @deprecated This prop is here for backwards compatibility with react-router v5 routes.
     */
    exact?: boolean;
    /**
     * @deprecated This prop is here for backwards compatibility with react-router v5 routes.
     */
    render?: (params: RoutePropsRenderParams) => React.ReactNode;
    /**
     * @deprecated This prop is here for backwards compatibility with react-router v5 routes.
     */
    component?: React.ComponentType;
}

export const Route: React.FC<RouteProps> = props => {
    const newProps = {
        ...props
    };
    const location = useLocation();
    if (!newProps.exact && newProps.path !== "*") {
        newProps.path = `${newProps.path}/*`;
    }
    delete newProps["exact"];

    if (typeof newProps.render === "function") {
        newProps.element = newProps.render({
            location
        });
    } else if (newProps.component) {
        const Component = newProps.component;
        newProps.element = <Component />;
    }
    delete newProps["render"];
    delete newProps["component"];

    return <BaseRoute {...newProps} />;
};
