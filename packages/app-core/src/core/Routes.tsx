import React, { useEffect } from "react";
import { useApp } from "~/index";
import { Route, RouteProps } from "@webiny/react-router";

export const AddRoute: React.FC<RouteProps> = props => {
    const { addRoute } = useApp();

    useEffect(() => {
        addRoute(<Route {...props} />);
    }, []);

    return null;
};
