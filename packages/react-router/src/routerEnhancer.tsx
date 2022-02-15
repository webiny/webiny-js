import React from "react";
import { RouterProvider } from "./context/RouterContext";

/**
 * @internal
 */
const routerEnhancer = (BaseComponent: any) => {
    const EnhancedComponent: React.FC = props => {
        return (
            <RouterProvider>
                <BaseComponent {...props} />
            </RouterProvider>
        );
    };
    return EnhancedComponent;
};

export default routerEnhancer;
