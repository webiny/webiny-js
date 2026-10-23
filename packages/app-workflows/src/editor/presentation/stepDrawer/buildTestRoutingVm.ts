import type { TestRoutingState } from "./TestRoutingState.js";
import type { TestRoutingVm } from "./abstractions.js";
import { TEST_ROUTING_MESSAGES } from "./testRoutingMessages.js";

export interface BuildTestRoutingVmParams {
    state: TestRoutingState;
    // `getTestRoutingSignature` of the inputs as they are now.
    currentSignature: string;
}

/*
 * The render-ready Test routing state (R234, R300). A done result is stale when the current
 * signature differs from the one taken when the request was sent; the old result is kept. A failed
 * run has no result. Pure.
 */
export const buildTestRoutingVm = (params: BuildTestRoutingVmParams): TestRoutingVm => {
    const state = params.state;
    const running = state.status === "running";
    const hasRequester = state.requesterId !== null;

    return {
        requesterId: state.requesterId,
        folderId: state.folderId,
        canRun: hasRequester && !running,
        hint: hasRequester ? null : TEST_ROUTING_MESSAGES.chooseRequester,
        buttonLabel: running ? TEST_ROUTING_MESSAGES.running : TEST_ROUTING_MESSAGES.button,
        status: state.status,
        stale: state.status === "done" && state.signature !== params.currentSignature,
        result: state.status === "done" ? state.result : null,
        errorMessage: state.status === "failed" ? state.errorMessage : null
    };
};
