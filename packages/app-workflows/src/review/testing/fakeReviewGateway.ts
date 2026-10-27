import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { ReviewGateway } from "~/review/gateway/abstractions.js";

type ReviewGatewayOperation = Exclude<keyof ReviewGateway.Interface, "getApp">;

type ReviewGatewayMocks = { [K in ReviewGatewayOperation]: Mock };

export interface FakeReviewGateway extends ReviewGatewayMocks {
    getApp: Mock<(namespace: string) => WorkflowAppKind>;
}

const readApp = (namespace: string): WorkflowAppKind => {
    if (namespace === "wb.page") {
        return "wb";
    }
    if (namespace.startsWith("cms.")) {
        return "cms";
    }
    throw new Error(`No workflows app handles the namespace "${namespace}".`);
};

/*
 * A fake of the routing review gateway (R355) for the repository and use-case tests: `getApp`
 * answers `wb` for `wb.page` and `cms` for a `cms.*` namespace, and throws the routing gateway's
 * message for any other; every operation is a bare `vi.fn()` that the test answers.
 */
export const createFakeReviewGateway = (): FakeReviewGateway => {
    return {
        getApp: vi.fn(readApp),
        listWorkflows: vi.fn(),
        getTargetReview: vi.fn(),
        getReview: vi.fn(),
        listStepCandidates: vi.fn(),
        listReviewStepCandidates: vi.fn(),
        getStepRun: vi.fn(),
        listReviews: vi.fn(),
        requestReview: vi.fn(),
        startStep: vi.fn(),
        takeOverStep: vi.fn(),
        reassignStep: vi.fn(),
        approveStep: vi.fn(),
        rejectStep: vi.fn(),
        cancelReview: vi.fn(),
        restartStep: vi.fn(),
        cancelForDelete: vi.fn(),
        listBlockingReviews: vi.fn()
    };
};
