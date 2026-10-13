import { Result } from "@webiny/feature/api";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import { getNamespaceApp } from "~/domain/routing/getNamespaceApp.js";
import { orderLeastLoaded } from "~/domain/routing/orderLeastLoaded.js";
import { orderRoundRobin } from "~/domain/routing/orderRoundRobin.js";
import { RoutingStrategyService as Abstraction } from "./abstractions.js";

const WORKFLOW_PAGE_SIZE = 100;

class RoutingStrategyServiceImpl implements Abstraction.Interface {
    public constructor(
        private assignments: AssignmentRepository.Interface,
        private reviews: ReviewRepository.Interface,
        private workflows: WorkflowRepository.Interface
    ) {}

    public async order(params: Abstraction.OrderParams): Abstraction.Return {
        if (params.candidates.length === 0) {
            return Result.ok([]);
        }

        if (params.strategy === "roundRobin") {
            // The step's last assignee: the newest outcome with a user (start, take over and
            // reassign count too). Pool outcomes have no user, skips are not outcomes.
            let lastAssigneeId: string | null = null;
            if (params.workflowId) {
                let after: string | null = null;
                do {
                    const page: Awaited<ReturnType<AssignmentRepository.Interface["list"]>> =
                        await this.assignments.list({
                            where: {
                                workflowId: params.workflowId,
                                stepId: params.stepId,
                                kind: "outcome"
                            },
                            after
                        });
                    if (page.isFail()) {
                        return Result.fail(new RoutingDependencyError(page.error));
                    }
                    lastAssigneeId = page.value.items.find(item => item.userId)?.userId ?? null;
                    const { meta } = page.value;
                    const next = meta.hasMoreItems ? meta.cursor : null;
                    // A repeated cursor would loop forever; treat it as the end.
                    after = !lastAssigneeId && next && next !== after ? next : null;
                } while (after);
            }
            return Result.ok(orderRoundRobin(params.candidates, lastAssigneeId));
        }

        // Least loaded (D137): in-review reviews owned per candidate, in the review's app only.
        const app = getNamespaceApp(params.model);
        const candidateIds = params.candidates.map(candidate => candidate.id);
        const owned = await this.reviews.listInReviewByOwners(candidateIds);
        if (owned.isFail()) {
            return Result.fail(new RoutingDependencyError(owned.error));
        }
        const loads = new Map<string, number>();
        for (const review of owned.value) {
            if (!review.currentOwnerId || getNamespaceApp(review.model) !== app) {
                continue;
            }
            loads.set(review.currentOwnerId, (loads.get(review.currentOwnerId) ?? 0) + 1);
        }

        const lastAssignedOn = new Map<string, string>();
        const candidateLoads = candidateIds.map(id => loads.get(id) ?? 0);
        if (new Set(candidateLoads).size < candidateLoads.length) {
            // Ties: the latest outcome of each candidate in the workflows of the same app.
            const workflowIds: string[] = [];
            let workflowsAfter: string | null = null;
            do {
                const page: Awaited<ReturnType<WorkflowRepository.Interface["list"]>> =
                    await this.workflows.list({ limit: WORKFLOW_PAGE_SIZE, after: workflowsAfter });
                if (page.isFail()) {
                    return Result.fail(new RoutingDependencyError(page.error));
                }
                for (const workflow of page.value.items) {
                    const sameApp =
                        workflow.models.length > 0 &&
                        workflow.models.every(model => getNamespaceApp(model) === app);
                    if (sameApp) {
                        workflowIds.push(workflow.id);
                    }
                }
                const { meta } = page.value;
                const next = meta.hasMoreItems ? meta.cursor : null;
                workflowsAfter = next && next !== workflowsAfter ? next : null;
            } while (workflowsAfter);

            const pending = new Set(candidateIds);
            let after: string | null = null;
            do {
                const page: Awaited<ReturnType<AssignmentRepository.Interface["list"]>> =
                    await this.assignments.list({
                        where: {
                            userId_in: candidateIds,
                            workflowId_in: workflowIds,
                            kind: "outcome"
                        },
                        after
                    });
                if (page.isFail()) {
                    return Result.fail(new RoutingDependencyError(page.error));
                }
                // Newest first: the first record per candidate is their latest assignment.
                for (const record of page.value.items) {
                    if (record.userId && pending.has(record.userId)) {
                        lastAssignedOn.set(record.userId, record.assignedOn);
                        pending.delete(record.userId);
                    }
                }
                const { meta } = page.value;
                const next = meta.hasMoreItems ? meta.cursor : null;
                after = pending.size > 0 && next && next !== after ? next : null;
            } while (after);
        }

        return Result.ok(orderLeastLoaded(params.candidates, loads, lastAssignedOn));
    }
}

export const RoutingStrategyService = Abstraction.createImplementation({
    implementation: RoutingStrategyServiceImpl,
    dependencies: [AssignmentRepository, ReviewRepository, WorkflowRepository]
});
