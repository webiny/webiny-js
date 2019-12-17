import React from "react";
import { RouterProvider } from "./context/RouterContext";

const withRouter = BaseComponent => {
    // eslint-disable-next-line react/display-name
    return (props: Object) => {
        return (
            <RouterProvider>
                <BaseComponent {...props} />
            </RouterProvider>
        );
    };
};

export default withRouter;
