import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { AdminUser } from "@webiny/api-core/features/users/shared/types.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import type { AssignmentEntry, AssignmentRecord } from "~/domain/assignment/types.js";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import { ListReviewAssignmentsUseCase as UseCase } from "./abstractions.js";

type AssignmentListPage = Awaited<ReturnType<AssignmentRepository.Interface["list"]>>;
type UserListResult = Result<AdminUser[], ListUsersUseCase.Error | Error>;

class ListReviewAssignmentsUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: AssignmentRepository.Interface,
        private identityContext: IdentityContext.Interface,
        private listUsers: ListUsersUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const records: AssignmentRecord[] = [];
        let after: string | null = null;
        do {
            // oxlint-disable-next-line no-await-in-loop -- one query per page of the review's records.
            const page: AssignmentListPage = await this.repository.list({
                where: { reviewId: input.reviewId },
                after
            });
            if (page.isFail()) {
                return Result.fail(page.error);
            }
            records.push(...page.value.items);
            const { meta } = page.value;
            const next = meta.hasMoreItems ? meta.cursor : null;
            // A repeated cursor would loop forever; treat it as the end.
            after = next && next !== after ? next : null;
        } while (after);

        const userIds = [
            ...new Set(records.map(record => record.userId).filter((id): id is string => !!id))
        ];
        const names = new Map<string, string>();
        if (userIds.length > 0) {
            // `ListUsers` needs a users permission, which a reviewer does not have.
            let listed: UserListResult;
            try {
                listed = await this.identityContext.withoutAuthorization(() => {
                    return this.listUsers.execute({ where: { id_in: userIds } });
                });
            } catch (error) {
                listed = Result.fail(error instanceof Error ? error : new Error(String(error)));
            }
            if (listed.isOk()) {
                for (const user of listed.value) {
                    names.set(user.id, user.displayName);
                }
            } else {
                this.logger.error(
                    {
                        err: hasErrorSource(listed.error) ? listed.error.source : listed.error,
                        reviewId: input.reviewId
                    },
                    "Could not look up the display names of a review's assignment entries."
                );
            }
        }

        return Result.ok(
            records.map((record): AssignmentEntry => {
                return {
                    ...record,
                    userDisplayName: record.userId ? (names.get(record.userId) ?? null) : null
                };
            })
        );
    }
}

export const ListReviewAssignmentsUseCase = UseCase.createImplementation({
    implementation: ListReviewAssignmentsUseCaseImpl,
    dependencies: [AssignmentRepository, IdentityContext, ListUsersUseCase, Logger]
});
