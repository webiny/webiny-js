import { Plugin } from "@webiny/api/types";

export type SecurityPlugin = Plugin & {
    authenticate: Function;
};
