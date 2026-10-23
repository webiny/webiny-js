import type { Container } from "@webiny/di";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { GetReviewStepRunUseCase } from "@webiny/api-workflows/features/stepRun/GetReviewStepRun/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ListReviewsUseCase } from "@webiny/api-workflows/features/review/ListReviews/index.js";
import { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ListReviewsByTargetsUseCase } from "@webiny/api-workflows/features/review/ListReviewsByTargets/index.js";
import { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import { TakeOverReviewStepUseCase } from "@webiny/api-workflows/features/review/TakeOverReviewStep/index.js";
import { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { ReassignReviewStepUseCase } from "@webiny/api-workflows/features/review/ReassignReviewStep/index.js";
import { RestartReviewStepUseCase } from "@webiny/api-workflows/features/review/RestartReviewStep/index.js";
import { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import { InspectRoutingUseCase } from "@webiny/api-workflows/features/routing/InspectRouting/index.js";

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

class CountingGetReviewStepRun implements GetReviewStepRunUseCase.Interface {
    public constructor(private decoratee: GetReviewStepRunUseCase.Interface) {}

    public async execute(input: GetReviewStepRunUseCase.Input): GetReviewStepRunUseCase.Return {
        engineCalls.push("GetReviewStepRun");
        return this.decoratee.execute(input);
    }
}

class CountingGetTargetReview implements GetTargetReviewUseCase.Interface {
    public constructor(private decoratee: GetTargetReviewUseCase.Interface) {}

    public async execute(input: GetTargetReviewUseCase.Input): GetTargetReviewUseCase.Return {
        engineCalls.push("GetTargetReview");
        return this.decoratee.execute(input);
    }
}

class CountingListReviews implements ListReviewsUseCase.Interface {
    public constructor(private decoratee: ListReviewsUseCase.Interface) {}

    public async execute(input: ListReviewsUseCase.Input): ListReviewsUseCase.Return {
        engineCalls.push("ListReviews");
        return this.decoratee.execute(input);
    }
}

class CountingListReviewAssignments implements ListReviewAssignmentsUseCase.Interface {
    public constructor(private decoratee: ListReviewAssignmentsUseCase.Interface) {}

    public async execute(
        input: ListReviewAssignmentsUseCase.Input
    ): ListReviewAssignmentsUseCase.Return {
        engineCalls.push("ListReviewAssignments");
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

class CountingListReviewsByTargets implements ListReviewsByTargetsUseCase.Interface {
    public constructor(private decoratee: ListReviewsByTargetsUseCase.Interface) {}

    public async execute(
        input: ListReviewsByTargetsUseCase.Input
    ): ListReviewsByTargetsUseCase.Return {
        engineCalls.push("ListReviewsByTargets");
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

class CountingRestartReviewStep implements RestartReviewStepUseCase.Interface {
    public constructor(private decoratee: RestartReviewStepUseCase.Interface) {}

    public async execute(input: RestartReviewStepUseCase.Input): RestartReviewStepUseCase.Return {
        engineCalls.push("RestartReviewStep");
        return this.decoratee.execute(input);
    }
}

class CountingReassignReviewStep implements ReassignReviewStepUseCase.Interface {
    public constructor(private decoratee: ReassignReviewStepUseCase.Interface) {}

    public async execute(input: ReassignReviewStepUseCase.Input): ReassignReviewStepUseCase.Return {
        engineCalls.push("ReassignReviewStep");
        return this.decoratee.execute(input);
    }
}

class CountingListStepCandidates implements ListStepCandidatesUseCase.Interface {
    public constructor(private decoratee: ListStepCandidatesUseCase.Interface) {}

    public async execute(input: ListStepCandidatesUseCase.Input): ListStepCandidatesUseCase.Return {
        engineCalls.push("ListStepCandidates");
        return this.decoratee.execute(input);
    }
}

class CountingInspectRouting implements InspectRoutingUseCase.Interface {
    public constructor(private decoratee: InspectRoutingUseCase.Interface) {}

    public async execute(input: InspectRoutingUseCase.Input): InspectRoutingUseCase.Return {
        engineCalls.push("InspectRouting");
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
        GetReviewStepRunUseCase.createDecorator({
            decorator: CountingGetReviewStepRun,
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
        ListReviewsByTargetsUseCase.createDecorator({
            decorator: CountingListReviewsByTargets,
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
    container.registerDecorator(
        GetTargetReviewUseCase.createDecorator({
            decorator: CountingGetTargetReview,
            dependencies: []
        })
    );
    container.registerDecorator(
        ListReviewsUseCase.createDecorator({ decorator: CountingListReviews, dependencies: [] })
    );
    container.registerDecorator(
        ListReviewAssignmentsUseCase.createDecorator({
            decorator: CountingListReviewAssignments,
            dependencies: []
        })
    );
    container.registerDecorator(
        ReassignReviewStepUseCase.createDecorator({
            decorator: CountingReassignReviewStep,
            dependencies: []
        })
    );
    container.registerDecorator(
        RestartReviewStepUseCase.createDecorator({
            decorator: CountingRestartReviewStep,
            dependencies: []
        })
    );
    container.registerDecorator(
        ListStepCandidatesUseCase.createDecorator({
            decorator: CountingListStepCandidates,
            dependencies: []
        })
    );
    container.registerDecorator(
        InspectRoutingUseCase.createDecorator({
            decorator: CountingInspectRouting,
            dependencies: []
        })
    );
};
