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
import { createStepRunInfoDto } from "~/review/testing/reviewFixtures.js";
import { GetStepRunUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetStepRunUseCase } from "./GetStepRunUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "cms.article",
    reviewId: "review-1",
    stepId: "step-1",
    taskId: "task-1"
};

describe("GetStepRunUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(GetStepRunUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the ids and maps the info of the task", async () => {
        const dto = createStepRunInfoDto({ taskId: "task-1", status: "done", iterations: 2 });
        gateway.getStepRun.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.getStepRun).toHaveBeenCalledWith(params);
        expect(result).toMatchObject({ taskId: "task-1", status: "done", iterations: 2 });
    });

    it("returns null when the task is gone (R257)", async () => {
        gateway.getStepRun.mockResolvedValue(null);

        await expect(useCase.execute(params)).resolves.toBeNull();
    });

    it("keeps the code and the data of a server error", async () => {
        const failure = new GraphQLOperationError({
            message: "The step run was not found.",
            code: "Workflows/Review/StepRunNotFound",
            data: { reviewId: "review-1", stepId: "step-1", taskId: "task-1" }
        });
        gateway.getStepRun.mockRejectedValue(failure);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
