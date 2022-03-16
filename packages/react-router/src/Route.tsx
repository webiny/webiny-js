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
    const location = useLocation();
    if (!props.exact && props.path !== "*") {
        props.path = `${props.path}/*`;
    }
    delete props["exact"];

    if (typeof props.render === "function") {
        props.element = props.render({
            location
        });
    } else if (props.component) {
        const Component = props.component;
        props.element = <Component />;
    }
    delete props["render"];
    delete props["component"];

    return <BaseRoute {...props} />;
};
