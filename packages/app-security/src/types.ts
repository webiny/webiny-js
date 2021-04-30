import { Plugin } from "@webiny/app/types";

export type SecureRouteErrorPlugin = Plugin & {
    render(): React.ReactElement;
};

export type FullAccessPermission = { name: "*" };
