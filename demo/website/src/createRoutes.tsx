import React from "react";
import { RouteProps } from "@webiny/react-router";
import { Router } from "./Router";

export const createRoutes = (): RouteProps[] => {
    return [{ path: "*", element: <Router /> }];
};
