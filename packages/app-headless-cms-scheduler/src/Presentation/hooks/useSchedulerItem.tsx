import { createGenericContext } from "@webiny/app-admin";
import { SchedulerEntry } from "~/types";

export interface SchedulerItemContext {
    item: SchedulerEntry;
}

const { Provider, useHook } = createGenericContext<SchedulerItemContext>("SchedulerItemContext");

export const useSchedulerItem = useHook;
export const SchedulerItemProvider = Provider;
