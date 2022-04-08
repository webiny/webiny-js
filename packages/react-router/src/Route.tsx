/**
 * TODO remove at some point and use the one from react-router-dom directly.
 * This component for our old code to work without much changes.
 */
import React from "react";
import { Route as BaseRoute, RouteProps as BaseRouteProps, useLocation } from "react-router-dom";
import { Location } from "history";

interface RoutePropsRenderParams {
    location: Location;
}
export interface RouteProps extends BaseRouteProps {
    exact?: boolean;
    render?: (params: RoutePropsRenderParams) => React.ReactNode;
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
