import { createGenericContext } from "@webiny/app-admin";
import type { WbSchedulerEntry } from "~/types.js";

export interface WbSchedulerItemContext {
    item: WbSchedulerEntry;
}

const { Provider, useHook } =
    createGenericContext<WbSchedulerItemContext>("WbSchedulerItemContext");

export const useWbSchedulerItem = useHook;
export const WbSchedulerItemProvider = Provider;
