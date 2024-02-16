import "./handler/register";
import { Plugin } from "@webiny/plugins/types";
import { createSocketsContext } from "~/context";

export const createSockets = (): Plugin[] => {
    return [createSocketsContext()];
};

export * from "./types";
