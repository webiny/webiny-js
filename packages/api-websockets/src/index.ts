import "./handler/register";
import { Plugin } from "@webiny/plugins/types";
import { createWebsocketsContext } from "~/context";
import { createWebsocketsGraphQL } from "~/graphql";

export const createWebsockets = (): Plugin[] => {
    return [createWebsocketsContext(), createWebsocketsGraphQL()];
};

export * from "./validator";
export * from "./transport";
export * from "./runner";
export * from "./registry";
export * from "./context";

export * from "./plugins";
export * from "./types";
