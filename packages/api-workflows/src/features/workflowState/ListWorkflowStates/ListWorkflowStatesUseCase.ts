import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserTeamsUseCase } from "~/features/internal/GetUserTeams/index.js";
import {
    ListWorkflowStatesRepository,
    ListWorkflowStatesUseCase as UseCase
} from "./abstractions.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import { WorkflowStateFilter } from "./WorkflowStateFilter.js";

class ListWorkflowStatesUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUserTeams: GetUserTeamsUseCase.Interface,
        private repository: ListWorkflowStatesRepository.Interface,
        private stateFilter: WorkflowStateFilter.Interface
    ) {}

    async execute(params: UseCase.Params = {}): UseCase.Return {
        const identity = this.identityContext.getIdentity();

        const teamsResult = await this.getUserTeams.execute(identity.id);
        const teams = teamsResult.value;

        const requestedLimit = params.limit || 50;
        const accumulated: WorkflowState[] = [];
        let cursor: string | null = params.after || null;
        let totalCount = 0;
        let totalRemoved = 0;
        let hasMoreItems = false;

        while (accumulated.length < requestedLimit) {
            const recordsResult = await this.repository.execute({
                ...params,
                limit: requestedLimit,
                after: cursor || undefined
            });

            if (recordsResult.isFail()) {
                return Result.fail(recordsResult.error);
            }

            const { items: records, meta } = recordsResult.value;
            totalCount = meta.totalCount;

            const items = records.map(record => new WorkflowState(record, teams, identity));
            const filtered = await this.stateFilter.filter(items);

            totalRemoved += items.length - filtered.length;
            accumulated.push(...filtered);

            if (!meta.hasMoreItems) {
                hasMoreItems = accumulated.length > requestedLimit;
                cursor = null;
                break;
            }

            cursor = meta.cursor;
            hasMoreItems = true;
        }

        const items = accumulated.slice(0, requestedLimit);

        return Result.ok({
            items,
            meta: {
                totalCount: Math.max(0, totalCount - totalRemoved),
                hasMoreItems,
                cursor
            }
        });
    }
}

export const ListWorkflowStatesUseCase = UseCase.createImplementation({
    implementation: ListWorkflowStatesUseCaseImpl,
    dependencies: [
        IdentityContext,
        GetUserTeamsUseCase,
        ListWorkflowStatesRepository,
        WorkflowStateFilter
    ]
});
