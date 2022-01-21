import React from "react";
import { RouterProvider } from "./context/RouterContext";

/**
 * @internal
 */
const routerEnhancer = (BaseComponent: any) => {
    return (props: Record<string, any>) => {
        return (
            <RouterProvider>
                <BaseComponent {...props} />
            </RouterProvider>
        );
    };
};

export default routerEnhancer;
