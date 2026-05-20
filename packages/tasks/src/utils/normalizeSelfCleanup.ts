import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

const ALL_EVENTS: ReadonlyArray<TaskDefinition.SelfCleanupEvent> = [
    "onSuccess",
    "onError",
    "onAbort"
];

export const normalizeSelfCleanup = (
    value: TaskDefinition.SelfCleanup | undefined
): ReadonlySet<TaskDefinition.SelfCleanupEvent> => {
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
