import { Plugin } from "@webiny/plugins/types";
import { Context } from "@webiny/handler/types";

export type PbInstallPlugin = Plugin & {
    name: "pb-install";
    before: (params: { context: Context; data: any }) => void;
    after: (params: { context: Context; data: any }) => void;
};
