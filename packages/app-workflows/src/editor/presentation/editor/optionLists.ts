import type { OptionList } from "./abstractions.js";
import type { OptionListStatus } from "./abstractions.js";

// An empty list in the given state.
export const createOptionList = <T>(status: OptionListStatus): OptionList<T> => {
    return { status, items: [] };
};

// What a lookup settled to: `ready` with its items, or `failed` with none.
export const toOptionList = <T>(result: PromiseSettledResult<T[]>): OptionList<T> => {
    if (result.status === "fulfilled") {
        return { status: "ready", items: result.value };
    }
    return { status: "failed", items: [] };
};
