import React from "react";
import { RouterComponent } from "webiny-react-router";
import HMR from "./HMR";

let Router = RouterComponent;

if (process.env.NODE_ENV === "development") {
    Router = props => {
        return (
            <HMR>
                <RouterComponent {...props} />
            </HMR>
        );
    };
}

export default Router;
