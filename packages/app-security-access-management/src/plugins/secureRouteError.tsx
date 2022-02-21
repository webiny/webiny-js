import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { NotAuthorizedError } from "~/components/NotAuthorizedError";

type SecureRouteErrorPlugin = Plugin & { render: () => React.ReactNode };

const plugin: SecureRouteErrorPlugin = {
    type: "secure-route-error",
    name: "secure-route-error",
    render(): React.ReactElement {
        return <NotAuthorizedError />;
    }
};

export default plugin;
