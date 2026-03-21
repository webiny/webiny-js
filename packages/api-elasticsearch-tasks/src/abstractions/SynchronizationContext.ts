import { createAbstraction } from "@webiny/feature/api";
import type { Context } from "~/types.js";

export type ISynchronizationContext = Pick<Context, "opensearch"> & { elasticsearch: Context["opensearch"] };

export const SynchronizationContext =
    createAbstraction<ISynchronizationContext>("SynchronizationContext");

export namespace SynchronizationContext {
    export type Interface = ISynchronizationContext;
}
