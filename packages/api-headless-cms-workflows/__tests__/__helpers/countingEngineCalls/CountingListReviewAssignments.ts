import type { Container } from "@webiny/di";
import { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingListReviewAssignments implements ListReviewAssignmentsUseCase.Interface {
    public constructor(private decoratee: ListReviewAssignmentsUseCase.Interface) {}

    public async execute(
        input: ListReviewAssignmentsUseCase.Input
    ): ListReviewAssignmentsUseCase.Return {
        engineCalls.push("ListReviewAssignments");
        return this.decoratee.execute(input);
    }
}

/** Records every `ListReviewAssignmentsUseCase` call in `engineCalls` as "ListReviewAssignments". */
export const countListReviewAssignmentsCalls = (container: Container): void => {
    container.registerDecorator(
        ListReviewAssignmentsUseCase.createDecorator({
            decorator: CountingListReviewAssignments,
            dependencies: []
        })
    );
};
