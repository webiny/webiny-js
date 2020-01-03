// @flow
import * as React from "react";
import type { Plugin } from "@webiny/plugins/types";
import Helmet from "react-helmet";

type SecureRouteErrorPluginType = Plugin & { render: () => React.ReactNode };

export default ({
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
}: SecureRouteErrorPluginType);
