import type {
    SelfCleanup,
    SelfCleanupEvent
} from "@webiny/api-core/features/task/TaskDefinition/index.js";

const ALL_EVENTS: ReadonlyArray<SelfCleanupEvent> = ["onSuccess", "onError", "onAbort"];

export const normalizeSelfCleanup = (
    value: SelfCleanup | undefined
): ReadonlySet<SelfCleanupEvent> => {
    if (value === undefined || value === "never") {
        return new Set();
    }
    if (value === "always") {
        return new Set(ALL_EVENTS);
    }
    if (Array.isArray(value)) {
        return new Set(value);
    }
    return new Set([value]);
};
