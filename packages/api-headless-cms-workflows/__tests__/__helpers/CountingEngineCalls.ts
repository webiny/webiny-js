import type { Container } from "@webiny/di";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";

/** Engine calls the handlers made, by use case name. Clear it in `beforeEach`. */
export const engineCalls: string[] = [];

class CountingGetWorkflow implements GetWorkflowUseCase.Interface {
    public constructor(private decoratee: GetWorkflowUseCase.Interface) {}

    public async execute(input: GetWorkflowUseCase.Input): GetWorkflowUseCase.Return {
        engineCalls.push("GetWorkflow");
        return this.decoratee.execute(input);
    }
}

class CountingStoreWorkflow implements StoreWorkflowUseCase.Interface {
    public constructor(private decoratee: StoreWorkflowUseCase.Interface) {}

    public async execute(input: StoreWorkflowUseCase.Input): StoreWorkflowUseCase.Return {
        engineCalls.push("StoreWorkflow");
        return this.decoratee.execute(input);
    }
}

class CountingDeleteWorkflow implements DeleteWorkflowUseCase.Interface {
    public constructor(private decoratee: DeleteWorkflowUseCase.Interface) {}

    public async execute(input: DeleteWorkflowUseCase.Input): DeleteWorkflowUseCase.Return {
        engineCalls.push("DeleteWorkflow");
        return this.decoratee.execute(input);
    }
}

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

class CountingRequestReview implements RequestReviewUseCase.Interface {
    public constructor(private decoratee: RequestReviewUseCase.Interface) {}

    public async execute(input: RequestReviewUseCase.Input): RequestReviewUseCase.Return {
        engineCalls.push("RequestReview");
        return this.decoratee.execute(input);
    }
}

class CountingGetReview implements GetReviewUseCase.Interface {
    public constructor(private decoratee: GetReviewUseCase.Interface) {}

    public async execute(input: GetReviewUseCase.Input): GetReviewUseCase.Return {
        engineCalls.push("GetReview");
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
        GetWorkflowUseCase.createDecorator({ decorator: CountingGetWorkflow, dependencies: [] })
    );
    container.registerDecorator(
        StoreWorkflowUseCase.createDecorator({ decorator: CountingStoreWorkflow, dependencies: [] })
    );
    container.registerDecorator(
        DeleteWorkflowUseCase.createDecorator({
            decorator: CountingDeleteWorkflow,
            dependencies: []
        })
    );
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
        RequestReviewUseCase.createDecorator({ decorator: CountingRequestReview, dependencies: [] })
    );
    container.registerDecorator(
        GetReviewUseCase.createDecorator({ decorator: CountingGetReview, dependencies: [] })
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
