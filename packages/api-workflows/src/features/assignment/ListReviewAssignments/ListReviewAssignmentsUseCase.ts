import { Result } from "@webiny/feature/api";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import type { AssignmentRecord } from "~/domain/assignment/types.js";
import { ListReviewAssignmentsUseCase as UseCase } from "./abstractions.js";

class ListReviewAssignmentsUseCaseImpl implements UseCase.Interface {
    constructor(private repository: AssignmentRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const records: AssignmentRecord[] = [];
        let after: string | null = null;
        do {
            const page: Awaited<ReturnType<AssignmentRepository.Interface["list"]>> =
                await this.repository.list({ where: { reviewId: input.reviewId }, after });
            if (page.isFail()) {
                return Result.fail(page.error);
            }
            records.push(...page.value.items);

            const { meta } = page.value;
            const next = meta.hasMoreItems ? meta.cursor : null;
            // A repeated cursor would loop forever; treat it as the end.
            after = next && next !== after ? next : null;
        } while (after);

        return Result.ok(records);
    }
}

export const ListReviewAssignmentsUseCase = UseCase.createImplementation({
    implementation: ListReviewAssignmentsUseCaseImpl,
    dependencies: [AssignmentRepository]
});
