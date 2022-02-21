import React, { useEffect } from "react";
import { useAdmin } from "~/index";
import { Route, RouteProps } from "@webiny/react-router";

export const AddRoute: React.FC<RouteProps> = props => {
    const { addRoute } = useAdmin();

    useEffect(() => {
        addRoute(<Route {...props} />);
    }, []);

    return null;
};
