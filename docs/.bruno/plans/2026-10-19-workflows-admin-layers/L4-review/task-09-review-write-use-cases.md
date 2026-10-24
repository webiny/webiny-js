### Task 9: The ten review write use cases

R343, R344, R348 (#24-#33), R354, R355, R360; Review Focus 1, 5, 6 (`../00-shared.md`). The admin-layers Global Constraints apply unchanged (R342; one class per file; one named import per line; no inline object types; no nested call arguments; namespace types outside the declaring file; targeted tests by path, one command at a time; the pre-commit chain; one commit).

The write operations of the review area become use cases over `ReviewRepository` (Task 8 already implements every repository method). Each is one `execute` that returns the repository's result and never catches (R343): a conflict, a validation error or a transport failure reaches the presenter unchanged, with its code and data (R220 classification stays in the presenters). Nothing consumes them yet (Tasks 10, 11 and 13 move the presenters, the dialogs and the trash guard).

- **Folders** (`[AWR]/useCases/<folder>/`: `<Name>UseCase.ts`, `feature.ts`, `<Name>UseCase.test.ts` beside Task 7's `abstractions.ts`): `requestReview` (`repository.requestReview`), `startReviewStep` (`startStep`), `takeOverReviewStep` (`takeOverStep`), `reassignReviewStep` (`reassignStep`), `approveReviewStep` (`approveStep`), `rejectReviewStep` (`rejectStep`), `cancelReview` (`cancelReview`), `restartReviewStep` (`restartStep`), `cancelReviewsForDelete` (`cancelForDelete`), `listBlockingReviews` (`listBlockingReviews`). Features `RequestReviewFeature` (`Workflows/RequestReview`), `StartReviewStepFeature`, `TakeOverReviewStepFeature`, `ReassignReviewStepFeature`, `ApproveReviewStepFeature`, `RejectReviewStepFeature`, `CancelReviewFeature`, `RestartReviewStepFeature`, `CancelReviewsForDeleteFeature`, `ListBlockingReviewsFeature`: transient registration, `resolve` = `{ useCase }` (R344).
- **Registration (R354).** `ReviewServicesFeature` registers the ten features after the seven read ones. `[AW]/app.test.tsx` and `[AWR]/feature.test.ts` resolve every new token with the flag on and fail to with it off.
- **Tests (R355, ported from `ReviewUseCases.test.ts` "actions", "cancelForDelete" and "listBlockingReviews").** Fake routing gateway + real repository: the use case passes its `Params` (with the namespace) to the gateway untouched, maps the result, keeps a null approve comment, maps every cancelled review, accepts a whole-target cancel (`targetRevisionId: null`), answers an empty blocking list, and lets a `GraphQLOperationError` pass unchanged.

**Files:**
- Create (10 x 3): `packages/app-workflows/src/review/useCases/{requestReview,startReviewStep,takeOverReviewStep,reassignReviewStep,approveReviewStep,rejectReviewStep,cancelReview,restartReviewStep,cancelReviewsForDelete,listBlockingReviews}/{<Name>UseCase.ts,feature.ts,<Name>UseCase.test.ts}`
- Modify: `packages/app-workflows/src/review/feature.ts`
- Modify: `packages/app-workflows/src/review/feature.test.ts`
- Modify: `packages/app-workflows/src/app.test.tsx`

**Interfaces:**
- Consumes: Task 7 (the ten `abstractions.ts` and their `Params`), Task 8 (`ReviewRepository` with `requestReview`, `startStep`, `takeOverStep`, `reassignStep`, `approveStep`, `rejectStep`, `cancelReview`, `restartStep`, `cancelForDelete`, `listBlockingReviews`; `ReviewServicesFeature` with the read features; `createFakeReviewGateway`; the `[AW]/app.test.tsx` "WorkflowsAdminApp review data layer" block). Existing (verified): `createReviewDto`, `createBlockingReviewDto` (`[AWRT]/reviewFixtures.ts`), `GraphQLOperationError`, `createFeature`.
- Produces (matches the contract): `RequestReviewUseCase`, `StartReviewStepUseCase`, `TakeOverReviewStepUseCase`, `ReassignReviewStepUseCase`, `ApproveReviewStepUseCase`, `RejectReviewStepUseCase`, `CancelReviewUseCase`, `RestartReviewStepUseCase`, `CancelReviewsForDeleteUseCase`, `ListBlockingReviewsUseCase` (implementations and features), consumed by Tasks 10, 11 and 13.

**Test runner note:** admin package, `yarn test <path>` only, one command at a time. Type check: `yarn build -p @webiny/app-workflows --no-cache`.

- [ ] **Step 1: Write the failing tests**

The eight action use cases share one test shape; each file is complete as shown.

`packages/app-workflows/src/review/useCases/requestReview/RequestReviewUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { RequestReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RequestReviewUseCase } from "./RequestReviewUseCase.js";

const params: UseCaseAbstraction.Params = {
    target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" },
    title: "Launch article",
    picks: [{ stepId: "step-1", userId: "user-9" }]
};

describe("RequestReviewUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(RequestReviewUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("starts a review of the target with the title and the picks and maps the review", async () => {
        const dto = createReviewDto({ id: "review-5" });
        gateway.requestReview.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.requestReview).toHaveBeenCalledTimes(1);
        expect(gateway.requestReview).toHaveBeenCalledWith(params);
        expect(result.id).toBe("review-5");
        expect(result.namespace).toBe("cms.article");
    });

    it("lets a conflict pass unchanged, with its code and data", async () => {
        const failure = new GraphQLOperationError({
            message: "The step is not the current step.",
            code: "Workflows/Review/StepNotCurrent",
            data: { reviewId: "review-1", stepId: "step-1" }
        });
        gateway.requestReview.mockRejectedValue(failure);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
```

`packages/app-workflows/src/review/useCases/startReviewStep/StartReviewStepUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { StartReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { StartReviewStepUseCase } from "./StartReviewStepUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "cms.article",
    reviewId: "review-1",
    stepId: "step-1"
};

describe("StartReviewStepUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(StartReviewStepUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("starts the step and maps the review", async () => {
        const dto = createReviewDto({ id: "review-5" });
        gateway.startStep.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.startStep).toHaveBeenCalledTimes(1);
        expect(gateway.startStep).toHaveBeenCalledWith(params);
        expect(result.id).toBe("review-5");
        expect(result.namespace).toBe("cms.article");
    });

    it("lets a conflict pass unchanged, with its code and data", async () => {
        const failure = new GraphQLOperationError({
            message: "The step is not the current step.",
            code: "Workflows/Review/StepNotCurrent",
            data: { reviewId: "review-1", stepId: "step-1" }
        });
        gateway.startStep.mockRejectedValue(failure);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
```

`packages/app-workflows/src/review/useCases/takeOverReviewStep/TakeOverReviewStepUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { TakeOverReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TakeOverReviewStepUseCase } from "./TakeOverReviewStepUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "cms.article",
    reviewId: "review-1",
    stepId: "step-1",
    notifyPreviousOwner: true
};

describe("TakeOverReviewStepUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(TakeOverReviewStepUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("takes over the step, keeps the notify choice, and maps the review", async () => {
        const dto = createReviewDto({ id: "review-5" });
        gateway.takeOverStep.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.takeOverStep).toHaveBeenCalledTimes(1);
        expect(gateway.takeOverStep).toHaveBeenCalledWith(params);
        expect(result.id).toBe("review-5");
        expect(result.namespace).toBe("cms.article");
    });

    it("lets a conflict pass unchanged, with its code and data", async () => {
        const failure = new GraphQLOperationError({
            message: "The step is not the current step.",
            code: "Workflows/Review/StepNotCurrent",
            data: { reviewId: "review-1", stepId: "step-1" }
        });
        gateway.takeOverStep.mockRejectedValue(failure);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
```

`packages/app-workflows/src/review/useCases/reassignReviewStep/ReassignReviewStepUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { ReassignReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ReassignReviewStepUseCase } from "./ReassignReviewStepUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "wb.page",
    reviewId: "review-1",
    stepId: "step-1",
    userId: "user-9"
};

describe("ReassignReviewStepUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(ReassignReviewStepUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("reassigns the step to the user and maps the review", async () => {
        const dto = createReviewDto({ id: "review-5", model: "wb.page" });
        gateway.reassignStep.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.reassignStep).toHaveBeenCalledTimes(1);
        expect(gateway.reassignStep).toHaveBeenCalledWith(params);
        expect(result.id).toBe("review-5");
        expect(result.namespace).toBe("wb.page");
    });

    it("lets a conflict pass unchanged, with its code and data", async () => {
        const failure = new GraphQLOperationError({
            message: "The step is not the current step.",
            code: "Workflows/Review/StepNotCurrent",
            data: { reviewId: "review-1", stepId: "step-1" }
        });
        gateway.reassignStep.mockRejectedValue(failure);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
```

`packages/app-workflows/src/review/useCases/approveReviewStep/ApproveReviewStepUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { ApproveReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ApproveReviewStepUseCase } from "./ApproveReviewStepUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "cms.article",
    reviewId: "review-1",
    stepId: "step-1",
    comment: "Looks good."
};

describe("ApproveReviewStepUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(ApproveReviewStepUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("approves the step with the comment and maps the review", async () => {
        const dto = createReviewDto({ id: "review-5" });
        gateway.approveStep.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.approveStep).toHaveBeenCalledTimes(1);
        expect(gateway.approveStep).toHaveBeenCalledWith(params);
        expect(result.id).toBe("review-5");
        expect(result.namespace).toBe("cms.article");
    });

    it("keeps a null comment", async () => {
        const dto = createReviewDto();
        gateway.approveStep.mockResolvedValue(dto);
        const withoutComment: UseCaseAbstraction.Params = { ...params, comment: null };

        await useCase.execute(withoutComment);

        expect(gateway.approveStep).toHaveBeenCalledWith(withoutComment);
    });

    it("lets a conflict pass unchanged, with its code and data", async () => {
        const failure = new GraphQLOperationError({
            message: "The step is not the current step.",
            code: "Workflows/Review/StepNotCurrent",
            data: { reviewId: "review-1", stepId: "step-1" }
        });
        gateway.approveStep.mockRejectedValue(failure);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
```

`packages/app-workflows/src/review/useCases/rejectReviewStep/RejectReviewStepUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { RejectReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RejectReviewStepUseCase } from "./RejectReviewStepUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "cms.article",
    reviewId: "review-1",
    stepId: "step-1",
    comment: "The headline is wrong."
};

describe("RejectReviewStepUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(RejectReviewStepUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("rejects the step with the comment and maps the review", async () => {
        const dto = createReviewDto({ id: "review-5" });
        gateway.rejectStep.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.rejectStep).toHaveBeenCalledTimes(1);
        expect(gateway.rejectStep).toHaveBeenCalledWith(params);
        expect(result.id).toBe("review-5");
        expect(result.namespace).toBe("cms.article");
    });

    it("lets a conflict pass unchanged, with its code and data", async () => {
        const failure = new GraphQLOperationError({
            message: "The step is not the current step.",
            code: "Workflows/Review/StepNotCurrent",
            data: { reviewId: "review-1", stepId: "step-1" }
        });
        gateway.rejectStep.mockRejectedValue(failure);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
```

`packages/app-workflows/src/review/useCases/cancelReview/CancelReviewUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { CancelReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CancelReviewUseCase } from "./CancelReviewUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "wb.page",
    reviewId: "review-1"
};

describe("CancelReviewUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(CancelReviewUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("cancels the review and maps it", async () => {
        const dto = createReviewDto({ id: "review-5", model: "wb.page" });
        gateway.cancelReview.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.cancelReview).toHaveBeenCalledTimes(1);
        expect(gateway.cancelReview).toHaveBeenCalledWith(params);
        expect(result.id).toBe("review-5");
        expect(result.namespace).toBe("wb.page");
    });

    it("lets a conflict pass unchanged, with its code and data", async () => {
        const failure = new GraphQLOperationError({
            message: "The step is not the current step.",
            code: "Workflows/Review/StepNotCurrent",
            data: { reviewId: "review-1", stepId: "step-1" }
        });
        gateway.cancelReview.mockRejectedValue(failure);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
```

`packages/app-workflows/src/review/useCases/restartReviewStep/RestartReviewStepUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { RestartReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RestartReviewStepUseCase } from "./RestartReviewStepUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "cms.article",
    reviewId: "review-1",
    stepId: "step-1"
};

describe("RestartReviewStepUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(RestartReviewStepUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("restarts the step and maps the review", async () => {
        const dto = createReviewDto({ id: "review-5" });
        gateway.restartStep.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.restartStep).toHaveBeenCalledTimes(1);
        expect(gateway.restartStep).toHaveBeenCalledWith(params);
        expect(result.id).toBe("review-5");
        expect(result.namespace).toBe("cms.article");
    });

    it("lets a conflict pass unchanged, with its code and data", async () => {
        const failure = new GraphQLOperationError({
            message: "The step is not the current step.",
            code: "Workflows/Review/StepNotCurrent",
            data: { reviewId: "review-1", stepId: "step-1" }
        });
        gateway.restartStep.mockRejectedValue(failure);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
```

`packages/app-workflows/src/review/useCases/cancelReviewsForDelete/CancelReviewsForDeleteUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { CancelReviewsForDeleteUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CancelReviewsForDeleteUseCase } from "./CancelReviewsForDeleteUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "cms.article",
    targetId: "entry-1",
    targetRevisionId: "entry-1#0002",
    action: "delete"
};

describe("CancelReviewsForDeleteUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(CancelReviewsForDeleteUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the params and maps every cancelled review", async () => {
        const first = createReviewDto({ id: "review-1" });
        const second = createReviewDto({ id: "review-2" });
        gateway.cancelForDelete.mockResolvedValue([first, second]);

        const result = await useCase.execute(params);

        expect(gateway.cancelForDelete).toHaveBeenCalledWith(params);
        expect(result.map(review => review.id)).toEqual(["review-1", "review-2"]);
    });

    it("accepts no target revision (a whole-target cancel of a page)", async () => {
        gateway.cancelForDelete.mockResolvedValue([]);
        const wholePage: UseCaseAbstraction.Params = {
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: null,
            action: "trash"
        };

        const result = await useCase.execute(wholePage);

        expect(gateway.cancelForDelete).toHaveBeenCalledWith(wholePage);
        expect(result).toEqual([]);
    });

    it("lets a server error pass unchanged", async () => {
        const failure = new GraphQLOperationError({
            message: "No access.",
            code: "Workflows/NotAuthorized"
        });
        gateway.cancelForDelete.mockRejectedValue(failure);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
```

`packages/app-workflows/src/review/useCases/listBlockingReviews/ListBlockingReviewsUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createBlockingReviewDto } from "~/review/testing/reviewFixtures.js";
import { ListBlockingReviewsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListBlockingReviewsUseCase } from "./ListBlockingReviewsUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "cms.article",
    targetIds: ["entry-1", "entry-2"]
};

describe("ListBlockingReviewsUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(ListBlockingReviewsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the namespace and the ids and maps every review", async () => {
        const first = createBlockingReviewDto({ reviewId: "review-1", targetId: "entry-1" });
        const second = createBlockingReviewDto({ reviewId: "review-2", targetId: "entry-2" });
        gateway.listBlockingReviews.mockResolvedValue([first, second]);

        const result = await useCase.execute(params);

        expect(gateway.listBlockingReviews).toHaveBeenCalledWith(params);
        expect(result.map(review => review.reviewId)).toEqual(["review-1", "review-2"]);
        expect(result[1].targetId).toBe("entry-2");
    });

    it("returns an empty list when no review blocks", async () => {
        gateway.listBlockingReviews.mockResolvedValue([]);

        await expect(useCase.execute(params)).resolves.toEqual([]);
    });

    it("lets a transport failure pass unchanged", async () => {
        const transport = new Error("Network down.");
        gateway.listBlockingReviews.mockRejectedValue(transport);

        await expect(useCase.execute(params)).rejects.toBe(transport);
    });
});
```

Modify `packages/app-workflows/src/review/feature.test.ts` (the block Task 8 added).

Imports, before:

```ts
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
```

After:

```ts
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
import { ApproveReviewStepUseCase } from "~/review/useCases/approveReviewStep/abstractions.js";
import { CancelReviewUseCase } from "~/review/useCases/cancelReview/abstractions.js";
import { CancelReviewsForDeleteUseCase } from "~/review/useCases/cancelReviewsForDelete/abstractions.js";
import { ListBlockingReviewsUseCase } from "~/review/useCases/listBlockingReviews/abstractions.js";
import { ReassignReviewStepUseCase } from "~/review/useCases/reassignReviewStep/abstractions.js";
import { RejectReviewStepUseCase } from "~/review/useCases/rejectReviewStep/abstractions.js";
import { RequestReviewUseCase } from "~/review/useCases/requestReview/abstractions.js";
import { RestartReviewStepUseCase } from "~/review/useCases/restartReviewStep/abstractions.js";
import { StartReviewStepUseCase } from "~/review/useCases/startReviewStep/abstractions.js";
import { TakeOverReviewStepUseCase } from "~/review/useCases/takeOverReviewStep/abstractions.js";
```

Add a case after Task 8's "registers the review data layer" case. Before:

```ts
        expect(container.resolve(GetStepRunUseCase)).toBeDefined();
        expect(container.resolve(ListReviewsUseCase)).toBeDefined();
    });

    it("registers them as singletons and resolves them", () => {
```

After:

```ts
        expect(container.resolve(GetStepRunUseCase)).toBeDefined();
        expect(container.resolve(ListReviewsUseCase)).toBeDefined();
    });

    it("registers the review write use cases transient (R354)", () => {
        const container = createContainer();
        ReviewServicesFeature.register(container);

        expect(container.resolve(RequestReviewUseCase)).not.toBe(
            container.resolve(RequestReviewUseCase)
        );
        expect(container.resolve(RequestReviewUseCase)).toBeDefined();
        expect(container.resolve(StartReviewStepUseCase)).toBeDefined();
        expect(container.resolve(TakeOverReviewStepUseCase)).toBeDefined();
        expect(container.resolve(ReassignReviewStepUseCase)).toBeDefined();
        expect(container.resolve(ApproveReviewStepUseCase)).toBeDefined();
        expect(container.resolve(RejectReviewStepUseCase)).toBeDefined();
        expect(container.resolve(CancelReviewUseCase)).toBeDefined();
        expect(container.resolve(RestartReviewStepUseCase)).toBeDefined();
        expect(container.resolve(CancelReviewsForDeleteUseCase)).toBeDefined();
        expect(container.resolve(ListBlockingReviewsUseCase)).toBeDefined();
    });

    it("registers them as singletons and resolves them", () => {
```

Modify `packages/app-workflows/src/app.test.tsx` (Task 8's "WorkflowsAdminApp review data layer" block).

Imports, before:

```ts
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
```

After:

```ts
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
import { ApproveReviewStepUseCase } from "~/review/useCases/approveReviewStep/abstractions.js";
import { CancelReviewUseCase } from "~/review/useCases/cancelReview/abstractions.js";
import { CancelReviewsForDeleteUseCase } from "~/review/useCases/cancelReviewsForDelete/abstractions.js";
import { ListBlockingReviewsUseCase } from "~/review/useCases/listBlockingReviews/abstractions.js";
import { ReassignReviewStepUseCase } from "~/review/useCases/reassignReviewStep/abstractions.js";
import { RejectReviewStepUseCase } from "~/review/useCases/rejectReviewStep/abstractions.js";
import { RequestReviewUseCase } from "~/review/useCases/requestReview/abstractions.js";
import { RestartReviewStepUseCase } from "~/review/useCases/restartReviewStep/abstractions.js";
import { StartReviewStepUseCase } from "~/review/useCases/startReviewStep/abstractions.js";
import { TakeOverReviewStepUseCase } from "~/review/useCases/takeOverReviewStep/abstractions.js";
```

Before (the end of the flag-on case):

```tsx
        expect(container.resolve(GetStepRunUseCase)).toBeDefined();
        expect(container.resolve(ListReviewsUseCase)).toBeDefined();
    });
```

After:

```tsx
        expect(container.resolve(GetStepRunUseCase)).toBeDefined();
        expect(container.resolve(ListReviewsUseCase)).toBeDefined();
        expect(container.resolve(RequestReviewUseCase)).toBeDefined();
        expect(container.resolve(StartReviewStepUseCase)).toBeDefined();
        expect(container.resolve(TakeOverReviewStepUseCase)).toBeDefined();
        expect(container.resolve(ReassignReviewStepUseCase)).toBeDefined();
        expect(container.resolve(ApproveReviewStepUseCase)).toBeDefined();
        expect(container.resolve(RejectReviewStepUseCase)).toBeDefined();
        expect(container.resolve(CancelReviewUseCase)).toBeDefined();
        expect(container.resolve(RestartReviewStepUseCase)).toBeDefined();
        expect(container.resolve(CancelReviewsForDeleteUseCase)).toBeDefined();
        expect(container.resolve(ListBlockingReviewsUseCase)).toBeDefined();
    });
```

Before (the end of the flag-off case):

```tsx
        expect(() => container.resolve(GetStepRunUseCase)).toThrow();
        expect(() => container.resolve(ListReviewsUseCase)).toThrow();
    });
```

After:

```tsx
        expect(() => container.resolve(GetStepRunUseCase)).toThrow();
        expect(() => container.resolve(ListReviewsUseCase)).toThrow();
        expect(() => container.resolve(RequestReviewUseCase)).toThrow();
        expect(() => container.resolve(StartReviewStepUseCase)).toThrow();
        expect(() => container.resolve(TakeOverReviewStepUseCase)).toThrow();
        expect(() => container.resolve(ReassignReviewStepUseCase)).toThrow();
        expect(() => container.resolve(ApproveReviewStepUseCase)).toThrow();
        expect(() => container.resolve(RejectReviewStepUseCase)).toThrow();
        expect(() => container.resolve(CancelReviewUseCase)).toThrow();
        expect(() => container.resolve(RestartReviewStepUseCase)).toThrow();
        expect(() => container.resolve(CancelReviewsForDeleteUseCase)).toThrow();
        expect(() => container.resolve(ListBlockingReviewsUseCase)).toThrow();
    });
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
yarn test packages/app-workflows/src/review/useCases/requestReview/RequestReviewUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/startReviewStep/StartReviewStepUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/takeOverReviewStep/TakeOverReviewStepUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/reassignReviewStep/ReassignReviewStepUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/approveReviewStep/ApproveReviewStepUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/rejectReviewStep/RejectReviewStepUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/cancelReview/CancelReviewUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/restartReviewStep/RestartReviewStepUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/cancelReviewsForDelete/CancelReviewsForDeleteUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/listBlockingReviews/ListBlockingReviewsUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/feature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: the ten use-case tests fail with `Failed to resolve import "./<Name>UseCase.js"`; `feature.test.ts` and `app.test.tsx` fail the new assertions with `No registration found for Workflows/RequestReviewUseCase`. Record the RED output.

- [ ] **Step 3: Implement**

`packages/app-workflows/src/review/useCases/requestReview/RequestReviewUseCase.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { RequestReviewUseCase as UseCaseAbstraction } from "./abstractions.js";

class RequestReviewUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.requestReview(params);
    }
}

export const RequestReviewUseCase = UseCaseAbstraction.createImplementation({
    implementation: RequestReviewUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/requestReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { RequestReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RequestReviewUseCase } from "./RequestReviewUseCase.js";

export const RequestReviewFeature = createFeature({
    name: "Workflows/RequestReview",
    register(container) {
        container.register(RequestReviewUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/startReviewStep/StartReviewStepUseCase.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { StartReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";

class StartReviewStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.startStep(params);
    }
}

export const StartReviewStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: StartReviewStepUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/startReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { StartReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { StartReviewStepUseCase } from "./StartReviewStepUseCase.js";

export const StartReviewStepFeature = createFeature({
    name: "Workflows/StartReviewStep",
    register(container) {
        container.register(StartReviewStepUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/takeOverReviewStep/TakeOverReviewStepUseCase.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { TakeOverReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";

class TakeOverReviewStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.takeOverStep(params);
    }
}

export const TakeOverReviewStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: TakeOverReviewStepUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/takeOverReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { TakeOverReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TakeOverReviewStepUseCase } from "./TakeOverReviewStepUseCase.js";

export const TakeOverReviewStepFeature = createFeature({
    name: "Workflows/TakeOverReviewStep",
    register(container) {
        container.register(TakeOverReviewStepUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/reassignReviewStep/ReassignReviewStepUseCase.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { ReassignReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";

class ReassignReviewStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.reassignStep(params);
    }
}

export const ReassignReviewStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: ReassignReviewStepUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/reassignReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ReassignReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ReassignReviewStepUseCase } from "./ReassignReviewStepUseCase.js";

export const ReassignReviewStepFeature = createFeature({
    name: "Workflows/ReassignReviewStep",
    register(container) {
        container.register(ReassignReviewStepUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/approveReviewStep/ApproveReviewStepUseCase.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { ApproveReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";

class ApproveReviewStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.approveStep(params);
    }
}

export const ApproveReviewStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: ApproveReviewStepUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/approveReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ApproveReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ApproveReviewStepUseCase } from "./ApproveReviewStepUseCase.js";

export const ApproveReviewStepFeature = createFeature({
    name: "Workflows/ApproveReviewStep",
    register(container) {
        container.register(ApproveReviewStepUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/rejectReviewStep/RejectReviewStepUseCase.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { RejectReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";

class RejectReviewStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.rejectStep(params);
    }
}

export const RejectReviewStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: RejectReviewStepUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/rejectReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { RejectReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RejectReviewStepUseCase } from "./RejectReviewStepUseCase.js";

export const RejectReviewStepFeature = createFeature({
    name: "Workflows/RejectReviewStep",
    register(container) {
        container.register(RejectReviewStepUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/cancelReview/CancelReviewUseCase.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { CancelReviewUseCase as UseCaseAbstraction } from "./abstractions.js";

class CancelReviewUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.cancelReview(params);
    }
}

export const CancelReviewUseCase = UseCaseAbstraction.createImplementation({
    implementation: CancelReviewUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/cancelReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { CancelReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CancelReviewUseCase } from "./CancelReviewUseCase.js";

export const CancelReviewFeature = createFeature({
    name: "Workflows/CancelReview",
    register(container) {
        container.register(CancelReviewUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/restartReviewStep/RestartReviewStepUseCase.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { RestartReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";

class RestartReviewStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.restartStep(params);
    }
}

export const RestartReviewStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: RestartReviewStepUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/restartReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { RestartReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RestartReviewStepUseCase } from "./RestartReviewStepUseCase.js";

export const RestartReviewStepFeature = createFeature({
    name: "Workflows/RestartReviewStep",
    register(container) {
        container.register(RestartReviewStepUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/cancelReviewsForDelete/CancelReviewsForDeleteUseCase.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { CancelReviewsForDeleteUseCase as UseCaseAbstraction } from "./abstractions.js";

class CancelReviewsForDeleteUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review[]> {
        return this.repository.cancelForDelete(params);
    }
}

export const CancelReviewsForDeleteUseCase = UseCaseAbstraction.createImplementation({
    implementation: CancelReviewsForDeleteUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/cancelReviewsForDelete/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { CancelReviewsForDeleteUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CancelReviewsForDeleteUseCase } from "./CancelReviewsForDeleteUseCase.js";

export const CancelReviewsForDeleteFeature = createFeature({
    name: "Workflows/CancelReviewsForDelete",
    register(container) {
        container.register(CancelReviewsForDeleteUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/review/useCases/listBlockingReviews/ListBlockingReviewsUseCase.ts`:

```ts
import type { BlockingReview } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { ListBlockingReviewsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListBlockingReviewsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<BlockingReview[]> {
        return this.repository.listBlockingReviews(params);
    }
}

export const ListBlockingReviewsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListBlockingReviewsUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

`packages/app-workflows/src/review/useCases/listBlockingReviews/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListBlockingReviewsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListBlockingReviewsUseCase } from "./ListBlockingReviewsUseCase.js";

export const ListBlockingReviewsFeature = createFeature({
    name: "Workflows/ListBlockingReviews",
    register(container) {
        container.register(ListBlockingReviewsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

Modify `packages/app-workflows/src/review/feature.ts` (as Task 8 left it).

Before:

```ts
import { ListStepCandidatesFeature } from "./useCases/listStepCandidates/feature.js";
```

After:

```ts
import { ListStepCandidatesFeature } from "./useCases/listStepCandidates/feature.js";
import { ApproveReviewStepFeature } from "./useCases/approveReviewStep/feature.js";
import { CancelReviewFeature } from "./useCases/cancelReview/feature.js";
import { CancelReviewsForDeleteFeature } from "./useCases/cancelReviewsForDelete/feature.js";
import { ListBlockingReviewsFeature } from "./useCases/listBlockingReviews/feature.js";
import { ReassignReviewStepFeature } from "./useCases/reassignReviewStep/feature.js";
import { RejectReviewStepFeature } from "./useCases/rejectReviewStep/feature.js";
import { RequestReviewFeature } from "./useCases/requestReview/feature.js";
import { RestartReviewStepFeature } from "./useCases/restartReviewStep/feature.js";
import { StartReviewStepFeature } from "./useCases/startReviewStep/feature.js";
import { TakeOverReviewStepFeature } from "./useCases/takeOverReviewStep/feature.js";
```

Before:

```ts
        GetStepRunFeature.register(container);
        ListReviewsFeature.register(container);
    },
```

After:

```ts
        GetStepRunFeature.register(container);
        ListReviewsFeature.register(container);
        RequestReviewFeature.register(container);
        StartReviewStepFeature.register(container);
        TakeOverReviewStepFeature.register(container);
        ReassignReviewStepFeature.register(container);
        ApproveReviewStepFeature.register(container);
        RejectReviewStepFeature.register(container);
        CancelReviewFeature.register(container);
        RestartReviewStepFeature.register(container);
        CancelReviewsForDeleteFeature.register(container);
        ListBlockingReviewsFeature.register(container);
    },
```

- [ ] **Step 4: Run the tests to see them pass**

Run the twelve commands of Step 2 again, one at a time.

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

```bash
yarn test packages/app-workflows/src/review/repository/ReviewRepository.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass (the index tests register `ReviewServicesFeature`, which now registers ten more features); no TypeScript errors.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "refactor(app-workflows): add the review write use cases" -m "Request, start, take over, reassign, approve, reject, cancel, restart, cancel for delete and the blocking-review list each become one use case over ReviewRepository, registered by ReviewServicesFeature." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- None. The ten use cases are the pass-through form R343 asks for; no write use case holds a business rule (R351). `ReviewUseCases.test.ts` ("actions", "cancelForDelete", "listBlockingReviews") stays until Task 14; its error-mapping cases are covered by Task 7's `ReviewGateway.test.ts`.

## Review fixes (sub-phase review)

- `ReassignReviewStepUseCase.test.ts` and `CancelReviewUseCase.test.ts` sent a `wb.page` namespace but asserted the mapped review's namespace as `cms.article` (the fixture's default model); the DTO is now built with `model: "wb.page"` and the assertion reads `wb.page`, so the case reads consistently. Behaviour unchanged.
