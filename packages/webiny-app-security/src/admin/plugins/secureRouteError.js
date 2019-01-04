// @flow
import * as React from "react";
import type { PluginType } from "webiny-plugins/types";

type SecureRouteErrorPluginType = PluginType & { render: () => React.Node };

export default ({
    type: "secure-route-error",
    name: "secure-route-error",
    render() {
        return <span>You are not authorized to access this route.</span>;
    }
}: SecureRouteErrorPluginType);
