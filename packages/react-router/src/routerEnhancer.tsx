import React from "react";
import { RouterProvider } from "./context/RouterContext";

interface EnhancedComponentProps {
    children?: React.ReactNode;
}

/**
 * @internal
 */
const routerEnhancer = (BaseComponent: any) => {
    const EnhancedComponent = (props: EnhancedComponentProps) => {
        return (
            <RouterProvider>
                <BaseComponent {...props} />
            </RouterProvider>
        );
    };
    return EnhancedComponent;
};

export default routerEnhancer;
