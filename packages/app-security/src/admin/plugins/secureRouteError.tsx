import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import NotAuthorizedError from "@webiny/app-security/components/NotAuthorizedError";

type SecureRouteErrorPlugin = Plugin & { render: () => React.ReactNode };

const plugin: SecureRouteErrorPlugin = {
    type: "secure-route-error",
    name: "secure-route-error",
    render() {
        return <NotAuthorizedError />;
    }
};

export default plugin;
