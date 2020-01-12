import { Plugin } from "@webiny/api/types";

export type SecurityPlugin = Plugin & {
    type: "graphql-security";
    authenticate(context: any): Promise<void>;
};
