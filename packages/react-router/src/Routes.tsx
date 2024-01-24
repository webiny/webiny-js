import React from "react";
import { RouteProps } from "~/Route";
import {
    Route,
    Routes as BaseRoutes,
    RoutesProps as BaseRoutesProps,
    useLocation,
    Location
} from "react-router-dom";

const createNativeRoute = (props: RouteProps, index: number, location: Location): JSX.Element => {
    const newProps = { ...props };
    if (!props.exact && props.path !== "*") {
        newProps.path = `${props.path}/*`;
    }
    delete newProps["exact"];

    if (typeof props.render === "function") {
        newProps.element = props.render({ location });
    } else if (props.component) {
        const Component = props.component;
        newProps.element = <Component />;
    }
    delete newProps["render"];
    delete newProps["component"];

    if (props.children) {
        newProps.element = props.children;
    }

    delete newProps["children"];

    return <Route key={`${newProps.path}:${index}`} {...newProps} />;
};

export type RoutesProps = BaseRoutesProps;

export const Routes = (props: RoutesProps) => {
    const location = useLocation();

    const children = React.Children.map(props.children, (route: any, index) => {
        if (!route) {
            return null;
        }
        return createNativeRoute(route.props, index, location);
    });

    return <BaseRoutes>{children}</BaseRoutes>;
};
