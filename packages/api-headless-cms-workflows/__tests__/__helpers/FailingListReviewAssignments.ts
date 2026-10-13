import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import { AssignmentPersistenceError } from "@webiny/api-workflows/domain/assignment/errors.js";

class FailingListReviewAssignments implements ListReviewAssignmentsUseCase.Interface {
    public constructor(private decoratee: ListReviewAssignmentsUseCase.Interface) {}

    public async execute(): ListReviewAssignmentsUseCase.Return {
        return Result.fail(new AssignmentPersistenceError(new Error("Storage is down.")));
    }
}

/** Every assignment-log read fails (`legacyPlugins`). */
export const failListReviewAssignments = (container: Container) => {
    container.registerDecorator(
        ListReviewAssignmentsUseCase.createDecorator({
            decorator: FailingListReviewAssignments,
            dependencies: []
        })
    );
};
