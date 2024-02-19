import "./handler/register";
import { Plugin } from "@webiny/plugins/types";
import { createSocketsContext } from "~/context";

export const createSockets = (): Plugin[] => {
    return [createSocketsContext()];
};

export * from "./validator";
export * from "./transporter";
export * from "./runner";
export * from "./registry";
export * from "./context";

export * from "./plugins";
export * from "./types";
