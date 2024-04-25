import React, { useEffect } from "react";
import { Route, RouteProps } from "@webiny/react-router";
import { useApp } from "~/App";
import { makeDecoratable } from "@webiny/react-composition";

export const AddRoute = makeDecoratable("AddRoute", (props: RouteProps) => {
    const { addRoute } = useApp();

    useEffect(() => {
        addRoute(<Route {...props} />);
    }, []);

    return null;
});
