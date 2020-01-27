import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import Helmet from "react-helmet";

type SecureRouteErrorPlugin = Plugin & { render: () => React.ReactNode };

const plugin: SecureRouteErrorPlugin = {
    type: "secure-route-error",
    name: "secure-route-error",
    render() {
        return (
            <>
                <Helmet title={"Not authorized"} />
                <span>You are not authorized to access this route.</span>
            </>
        );
    }
};

export default plugin;
