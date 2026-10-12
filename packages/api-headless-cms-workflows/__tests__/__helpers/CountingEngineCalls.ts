import type { Container } from "@webiny/di";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";

/** Engine calls the handlers made, by use case name. Clear it in `beforeEach`. */
export const engineCalls: string[] = [];

class CountingListWorkflows implements ListWorkflowsUseCase.Interface {
    public constructor(private decoratee: ListWorkflowsUseCase.Interface) {}

    public async execute(input?: ListWorkflowsUseCase.Input): ListWorkflowsUseCase.Return {
        engineCalls.push("ListWorkflows");
        return this.decoratee.execute(input);
    }
}

class CountingGetBoundWorkflow implements GetBoundWorkflowUseCase.Interface {
    public constructor(private decoratee: GetBoundWorkflowUseCase.Interface) {}

    public async execute(input: GetBoundWorkflowUseCase.Input): GetBoundWorkflowUseCase.Return {
        engineCalls.push("GetBoundWorkflow");
        return this.decoratee.execute(input);
    }
}

class CountingListTargetReviews implements ListTargetReviewsUseCase.Interface {
    public constructor(private decoratee: ListTargetReviewsUseCase.Interface) {}

    public async execute(
        input: Parameters<ListTargetReviewsUseCase.Interface["execute"]>[0]
    ): ListTargetReviewsUseCase.Return {
        engineCalls.push("ListTargetReviews");
        return this.decoratee.execute(input);
    }
}

class CountingDeleteTargetReviews implements DeleteTargetReviewsUseCase.Interface {
    public constructor(private decoratee: DeleteTargetReviewsUseCase.Interface) {}

    public async execute(
        input: DeleteTargetReviewsUseCase.Input
    ): DeleteTargetReviewsUseCase.Return {
        engineCalls.push("DeleteTargetReviews");
        return this.decoratee.execute(input);
    }
}

/** Records every workflow and review lookup the handlers make in `engineCalls` (`legacyPlugins`). */
export const countEngineCalls = (container: Container) => {
    container.registerDecorator(
        ListWorkflowsUseCase.createDecorator({ decorator: CountingListWorkflows, dependencies: [] })
    );
    container.registerDecorator(
        GetBoundWorkflowUseCase.createDecorator({
            decorator: CountingGetBoundWorkflow,
            dependencies: []
        })
    );
    container.registerDecorator(
        ListTargetReviewsUseCase.createDecorator({
            decorator: CountingListTargetReviews,
            dependencies: []
        })
    );
    container.registerDecorator(
        DeleteTargetReviewsUseCase.createDecorator({
            decorator: CountingDeleteTargetReviews,
            dependencies: []
        })
    );
};
