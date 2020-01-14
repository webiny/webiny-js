import React from "react";
import { RouterProvider } from "./context/RouterContext";

const routerEnhancer = BaseComponent => {
    // eslint-disable-next-line react/display-name
    return props => {
        return (
            <RouterProvider>
                <BaseComponent {...props} />
            </RouterProvider>
        );
    };
};

export default routerEnhancer;
