/**
 * TODO remove at some point and use the one from react-router-dom directly.
 * This component for our old code to work without much changes.
 */
import { RouteProps as BaseRouteProps } from "react-router-dom";
import React from "react";
import { Location } from "history";

interface RoutePropsRenderParams {
    location: Location;
}
export interface RouteProps extends BaseRouteProps {
    exact?: boolean;
    render?: (params: RoutePropsRenderParams) => React.ReactNode;
    component?: React.ComponentType;
}
