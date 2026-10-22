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

type AssignmentListPage = Awaited<ReturnType<AssignmentRepository.Interface["list"]>>;
type WorkflowListPage = Awaited<ReturnType<WorkflowRepository.Interface["list"]>>;

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
            // reassign count too). Pool outcomes have no user, skips are not outcomes. "Newest"
            // is the repository's `createdOn` order, stored as `assignedOn` (records are written
            // right after the review save).
            let lastAssigneeId: string | null = null;
            if (params.workflowId) {
                let after: string | null = null;
                do {
                    // oxlint-disable-next-line no-await-in-loop -- one query per page; stops at the first page with an assignee.
                    const page: AssignmentListPage = await this.assignments.list({
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

        // Least loaded (D137): in-review reviews owned per candidate, in the review's app only,
        // without the review being routed (a candidate who owned its previous step).
        const app = getNamespaceApp(params.model);
        const candidateIds = params.candidates.map(candidate => candidate.id);
        const owned = await this.reviews.listInReviewByOwners(candidateIds);
        if (owned.isFail()) {
            return Result.fail(new RoutingDependencyError(owned.error));
        }
        const loads = new Map<string, number>();
        for (const review of owned.value) {
            if (
                !review.currentOwnerId ||
                review.id === params.reviewId ||
                getNamespaceApp(review.model) !== app
            ) {
                continue;
            }
            loads.set(review.currentOwnerId, (loads.get(review.currentOwnerId) ?? 0) + 1);
        }

        // Ties matter only at the lowest load: the strategy asks those candidates first, the
        // rest are ordered by load and user id. Ties among higher loads read no history.
        const lowestLoad = Math.min(...candidateIds.map(id => loads.get(id) ?? 0));
        const tiedIds = candidateIds.filter(id => (loads.get(id) ?? 0) === lowestLoad);
        const lastAssignedOn = new Map<string, string>();
        if (tiedIds.length > 1) {
            // The latest outcome of each tied candidate in the workflows of the same app.
            const workflowIds: string[] = [];
            let workflowsAfter: string | null = null;
            do {
                // oxlint-disable-next-line no-await-in-loop -- one query per page of workflows.
                const page: WorkflowListPage = await this.workflows.list({
                    limit: WORKFLOW_PAGE_SIZE,
                    after: workflowsAfter
                });
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

            // The latest record of each tied candidate, from one list of all their records:
            // newest first, scanned until every tied candidate has one (more pages only when a
            // candidate has no recent record). "Latest" is the repository's `createdOn` order,
            // stored as `assignedOn` (records are written right after the review save). An empty
            // `workflowId_in` matches nothing, so no read is needed.
            if (workflowIds.length > 0) {
                const tiedCount = new Set(tiedIds).size;
                let recordsAfter: string | null = null;
                do {
                    // oxlint-disable-next-line no-await-in-loop -- one query per page of the tied candidates' records.
                    const page: AssignmentListPage = await this.assignments.list({
                        where: {
                            userId_in: tiedIds,
                            workflowId_in: workflowIds,
                            kind: "outcome"
                        },
                        after: recordsAfter
                    });
                    if (page.isFail()) {
                        return Result.fail(new RoutingDependencyError(page.error));
                    }
                    for (const record of page.value.items) {
                        if (record.userId && !lastAssignedOn.has(record.userId)) {
                            lastAssignedOn.set(record.userId, record.assignedOn);
                        }
                    }
                    const { meta } = page.value;
                    const next = meta.hasMoreItems ? meta.cursor : null;
                    const allFound = lastAssignedOn.size === tiedCount;
                    // A repeated cursor would loop forever; treat it as the end.
                    recordsAfter = !allFound && next && next !== recordsAfter ? next : null;
                } while (recordsAfter);
            }
        }

        return Result.ok(orderLeastLoaded(params.candidates, loads, lastAssignedOn));
    }
}

export const RoutingStrategyService = Abstraction.createImplementation({
    implementation: RoutingStrategyServiceImpl,
    dependencies: [AssignmentRepository, ReviewRepository, WorkflowRepository]
});
