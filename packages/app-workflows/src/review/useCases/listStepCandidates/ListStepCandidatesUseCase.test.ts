import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { ListStepCandidatesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListStepCandidatesUseCase } from "./ListStepCandidatesUseCase.js";

const params: UseCaseAbstraction.Params = {
    workflowId: "workflow-1",
    stepId: "step-1",
    target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" }
};

describe("ListStepCandidatesUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(ListStepCandidatesUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the params and maps the candidates", async () => {
        gateway.listStepCandidates.mockResolvedValue([
            { id: "user-1", displayName: "Ada", excluded: false, excludedReason: null },
            { id: "user-2", displayName: "Grace", excluded: true, excludedReason: "On leave." }
        ]);

        const result = await useCase.execute(params);

        expect(gateway.listStepCandidates).toHaveBeenCalledWith(params);
        expect(result).toEqual([
            { id: "user-1", displayName: "Ada", excluded: false, excludedReason: null },
            { id: "user-2", displayName: "Grace", excluded: true, excludedReason: "On leave." }
        ]);
    });
});
