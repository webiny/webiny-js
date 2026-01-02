import { createAbstraction } from "@webiny/feature/api";
import type { Context } from "~/types.js";

export type ISynchronizationContext = Pick<Context, "elasticsearch">;

export const SynchronizationContext =
    createAbstraction<ISynchronizationContext>("SynchronizationContext");

export namespace SynchronizationContext {
    export type Interface = ISynchronizationContext;
}
