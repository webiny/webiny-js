import React, { useEffect } from "react";
import { useApp } from "~/App";
import { Route, RouteProps } from "@webiny/react-router";

export const AddRoute = (props: RouteProps) => {
    const { addRoute } = useApp();

    useEffect(() => {
        addRoute(<Route {...props} />);
    }, []);

    return null;
};
