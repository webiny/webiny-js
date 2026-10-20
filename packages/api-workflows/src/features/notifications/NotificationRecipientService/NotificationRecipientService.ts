import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { MAX_USER_LIST_LIMIT } from "~/constants.js";
import type { RoutingDependencyError } from "~/domain/routing/errors.js";
import type { RoutingMember, RoutingMembersParams } from "~/domain/routing/types.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
import type { NotificationTransport } from "~/features/notifications/NotificationTransport/abstractions.js";
import { NotificationRecipientService as Abstraction } from "./abstractions.js";

class NotificationRecipientServiceImpl implements Abstraction.Interface {
    public constructor(
        private routing: RoutingEvaluatorService.Interface,
        private identityContext: IdentityContext.Interface,
        private listUsersUseCase: ListUsersUseCase.Interface
    ) {}

    public async listPool(params: Abstraction.PoolParams): Abstraction.PoolReturn {
        const { review, stepId, now } = params;
        const step = review.steps.find(item => item.id === stepId);
        if (!step) {
            return Result.fail(
                new WorkflowPersistenceError(
                    new Error(`Step "${stepId}" does not exist in this review.`)
                )
            );
        }

        // The same params `ListStepCandidatesUseCase` builds for a review's step (R120).
        const membersParams: RoutingMembersParams = {
            teamIds: [...step.candidateTeamIds],
            requesterId: review.createdBy.id,
            model: review.model,
            read: {
                type: "target",
                targetId: review.targetId,
                targetRevisionId: review.targetRevisionId
            },
            now
        };

        // `listMembers` returns every member except the requester, with `exclusion` and
        // `canRead`, and filters nothing (R194). Its user lookup and its read checks (as the
        // request identity) are its own business: nothing is wrapped here.
        let listed: Result<RoutingMember[], RoutingDependencyError>;
        try {
            listed = await this.routing.listMembers(membersParams);
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (listed.isFail()) {
            return Result.fail(new WorkflowPersistenceError(listed.error));
        }

        const pool: Abstraction.Recipient[] = [];
        for (const member of listed.value) {
            if (!member.exclusion && member.canRead) {
                pool.push({ id: member.id, displayName: member.displayName });
            }
        }
        return Result.ok(pool);
    }

    public async listUsers(ids: string[]): Abstraction.UsersReturn {
        const unique = [...new Set(ids.filter(id => typeof id === "string" && id.trim() !== ""))];
        if (unique.length === 0) {
            return Result.ok([]);
        }

        const users: NotificationTransport.User[] = [];
        for (let start = 0; start < unique.length; start += MAX_USER_LIST_LIMIT) {
            const chunk = unique.slice(start, start + MAX_USER_LIST_LIMIT);

            // `ListUsersUseCase` needs `adminUsers.user`: a lookup of the people to tell, not an
            // access decision. Only this call runs without authorization.
            let listed: Result<AdminUser[], ListUsersUseCase.Error>;
            try {
                listed = await this.identityContext.withoutAuthorization(() => {
                    return this.listUsersUseCase.execute({ where: { id_in: chunk } });
                });
            } catch (error) {
                return Result.fail(
                    new WorkflowPersistenceError(
                        error instanceof Error ? error : new Error(String(error))
                    )
                );
            }
            if (listed.isFail()) {
                return Result.fail(new WorkflowPersistenceError(listed.error));
            }
            for (const user of listed.value) {
                users.push({ id: user.id, email: user.email, displayName: user.displayName });
            }
        }
        return Result.ok(users);
    }
}

export const NotificationRecipientService = Abstraction.createImplementation({
    implementation: NotificationRecipientServiceImpl,
    dependencies: [RoutingEvaluatorService, IdentityContext, ListUsersUseCase]
});
