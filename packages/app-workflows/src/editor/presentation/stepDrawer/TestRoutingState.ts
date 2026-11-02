import type { TestRoutingResultVm } from "~/editor/model/testRouting/TestRoutingResultVm.js";

export type TestRoutingStatus = "idle" | "running" | "done" | "failed";

// The Test routing state of one open step (R300); the drawer presenter replaces it, never mutates it.
export interface TestRoutingState {
    requesterId: string | null;
    folderId: string | null;
    status: TestRoutingStatus;
    result: TestRoutingResultVm | null;
    errorMessage: string | null;
    // The signature of the inputs when the last request was sent; null before the first run.
    signature: string | null;
}

export const createTestRoutingState = (): TestRoutingState => {
    return {
        requesterId: null,
        folderId: null,
        status: "idle",
        result: null,
        errorMessage: null,
        signature: null
    };
};
