import React, { useLayoutEffect, useState } from "react";
import { Router } from "react-router";
import type { History } from "history";
import { BrowserRouterProps as BaseBrowserRouterProps } from "react-router-dom";
import { RouterProvider } from "./context/RouterContext";

export interface BrowserRouterProps extends BaseBrowserRouterProps {
    history: History;
    getBasename?: () => string | undefined;
}

export function BrowserRouter({ children, history, getBasename, ...props }: BrowserRouterProps) {
    const [state, setState] = useState({
        action: history.action,
        location: history.location
    });

    useLayoutEffect(() => history.listen(setState), [history]);

    return (
        <RouterProvider>
            <Router
                {...props}
                basename={getBasename ? getBasename() : props.basename}
                navigator={history}
                location={state.location}
                navigationType={state.action}
            >
                {children}
            </Router>
        </RouterProvider>
    );
}
