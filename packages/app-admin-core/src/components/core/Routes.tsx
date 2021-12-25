import React, { useEffect } from "react";
import { useAdmin } from "~/index";
import { Route, RouteProps } from "@webiny/react-router";

export const AddRoute = (props: RouteProps) => {
    const { addRoute } = useAdmin();

    useEffect(() => {
        addRoute(<Route {...props} />);
    }, []);

    return null;
};
