// @flow
import * as React from "react";
import type { PluginType } from "webiny-plugins/types";
import Helmet from "react-helmet";

type SecureRouteErrorPluginType = PluginType & { render: () => React.Node };

export default ({
    type: "secure-route-error",
    name: "secure-route-error",
    render() {
        return (
            <>
                <Helmet>
                    <title>Not authorized</title>
                </Helmet>
                <span>You are not authorized to access this route.</span>
            </>
        );
    }
}: SecureRouteErrorPluginType);
