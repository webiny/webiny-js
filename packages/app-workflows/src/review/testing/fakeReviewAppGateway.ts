import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { ReviewAppGateway } from "~/review/appGateway/abstractions.js";

// The envelope operations of an app gateway, without `app` and `canHandle`.
export type ReviewAppGatewayOperation = Exclude<
    keyof ReviewAppGateway.Interface,
    "app" | "canHandle"
>;

type ReviewAppGatewayMocks = { [K in ReviewAppGatewayOperation]: Mock };

export interface FakeReviewAppGateway extends ReviewAppGatewayMocks {
    readonly app: WorkflowAppKind;
    canHandle: Mock<(namespace: string) => boolean>;
}

/*
 * A fake app gateway for the routing tests (R355): it serves `app`, claims exactly the given
 * namespaces, and every envelope operation is a bare `vi.fn()` the test answers with
 * `mockResolvedValue` or `mockRejectedValue`.
 */
export const createFakeReviewAppGateway = (
    app: WorkflowAppKind,
    claimedNamespaces: string[]
): FakeReviewAppGateway => {
    return {
        app,
        canHandle: vi.fn((namespace: string) => claimedNamespaces.includes(namespace)),
        listWorkflows: vi.fn(),
        getTargetReview: vi.fn(),
        getReview: vi.fn(),
        listStepCandidates: vi.fn(),
        listReviewStepCandidates: vi.fn(),
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
        getStepRun: vi.fn(),
        listBlockingReviews: vi.fn()
    };
};
