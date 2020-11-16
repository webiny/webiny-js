import { Plugin } from "@webiny/plugins/types";
import { HandlerContext } from "@webiny/handler/types";

export type PbInstallPlugin = Plugin & {
    name: "pb-install";
    before: (params: { context: HandlerContext; data: any }) => void;
    after: (params: { context: HandlerContext; data: any }) => void;
};
