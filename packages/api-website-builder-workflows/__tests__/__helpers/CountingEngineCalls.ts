import type { Container } from "@webiny/di";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import { TakeOverReviewStepUseCase } from "@webiny/api-workflows/features/review/TakeOverReviewStep/index.js";
import { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
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

class CountingStartReviewStep implements StartReviewStepUseCase.Interface {
    public constructor(private decoratee: StartReviewStepUseCase.Interface) {}

    public async execute(input: StartReviewStepUseCase.Input): StartReviewStepUseCase.Return {
        engineCalls.push("StartReviewStep");
        return this.decoratee.execute(input);
    }
}

class CountingTakeOverReviewStep implements TakeOverReviewStepUseCase.Interface {
    public constructor(private decoratee: TakeOverReviewStepUseCase.Interface) {}

    public async execute(input: TakeOverReviewStepUseCase.Input): TakeOverReviewStepUseCase.Return {
        engineCalls.push("TakeOverReviewStep");
        return this.decoratee.execute(input);
    }
}

class CountingApproveReviewStep implements ApproveReviewStepUseCase.Interface {
    public constructor(private decoratee: ApproveReviewStepUseCase.Interface) {}

    public async execute(input: ApproveReviewStepUseCase.Input): ApproveReviewStepUseCase.Return {
        engineCalls.push("ApproveReviewStep");
        return this.decoratee.execute(input);
    }
}

class CountingRejectReviewStep implements RejectReviewStepUseCase.Interface {
    public constructor(private decoratee: RejectReviewStepUseCase.Interface) {}

    public async execute(input: RejectReviewStepUseCase.Input): RejectReviewStepUseCase.Return {
        engineCalls.push("RejectReviewStep");
        return this.decoratee.execute(input);
    }
}

class CountingCancelReview implements CancelReviewUseCase.Interface {
    public constructor(private decoratee: CancelReviewUseCase.Interface) {}

    public async execute(input: CancelReviewUseCase.Input): CancelReviewUseCase.Return {
        engineCalls.push("CancelReview");
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
    container.registerDecorator(
        StartReviewStepUseCase.createDecorator({
            decorator: CountingStartReviewStep,
            dependencies: []
        })
    );
    container.registerDecorator(
        TakeOverReviewStepUseCase.createDecorator({
            decorator: CountingTakeOverReviewStep,
            dependencies: []
        })
    );
    container.registerDecorator(
        ApproveReviewStepUseCase.createDecorator({
            decorator: CountingApproveReviewStep,
            dependencies: []
        })
    );
    container.registerDecorator(
        RejectReviewStepUseCase.createDecorator({
            decorator: CountingRejectReviewStep,
            dependencies: []
        })
    );
    container.registerDecorator(
        CancelReviewUseCase.createDecorator({ decorator: CountingCancelReview, dependencies: [] })
    );
};
