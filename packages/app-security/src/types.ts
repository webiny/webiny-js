import { Plugin } from "@webiny/app/types";

export type SecureRouteErrorPlugin = Plugin & {
    render(): React.ReactElement;
};

export interface FullAccessPermission {
    name: "*";
}

export interface SecurityPermission {
    name: string;
    [key: string]: any;
}
