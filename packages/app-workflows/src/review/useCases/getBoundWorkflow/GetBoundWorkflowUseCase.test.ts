import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository as RepositoryAbstraction } from "~/review/repository/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createWorkflowDto } from "~/review/testing/createWorkflowDto.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { GetBoundWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetBoundWorkflowUseCase } from "./GetBoundWorkflowUseCase.js";

describe("GetBoundWorkflowUseCase", () => {
    let gateway: FakeReviewGateway;
    let repository: RepositoryAbstraction.Interface;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(GetBoundWorkflowUseCase);
        repository = container.resolve(RepositoryAbstraction);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("returns the mapped workflow that binds the namespace (R351)", async () => {
        const article = createWorkflowDto("workflow-1", ["cms.article"]);
        const author = createWorkflowDto("workflow-2", ["cms.author"]);
        gateway.listWorkflows.mockResolvedValue([article, author]);

        const workflow = await useCase.execute({ namespace: "cms.author" });

        expect(workflow).toEqual({
            id: "workflow-2",
            name: "Workflow workflow-2",
            namespaces: ["cms.author"],
            steps: [
                {
                    id: "step-1",
                    title: "Editorial check",
                    color: "#2f80ed",
                    description: null,
                    type: "review",
                    allowManualPick: true,
                    assignedAutomatically: false
                }
            ]
        });
    });

    it("finds a workflow that binds several namespaces by any of them", async () => {
        const shared = createWorkflowDto("workflow-1", ["cms.article", "cms.author"]);
        gateway.listWorkflows.mockResolvedValue([shared]);

        const workflow = await useCase.execute({ namespace: "cms.author" });

        expect(workflow?.id).toBe("workflow-1");
    });

    it("returns null when no workflow binds the namespace", async () => {
        const article = createWorkflowDto("workflow-1", ["cms.article"]);
        gateway.listWorkflows.mockResolvedValue([article]);

        await expect(useCase.execute({ namespace: "cms.page" })).resolves.toBeNull();
    });

    it("reads the cached list of the app: several namespaces, one request", async () => {
        const article = createWorkflowDto("workflow-1", ["cms.article"]);
        gateway.listWorkflows.mockResolvedValue([article]);

        const first = await useCase.execute({ namespace: "cms.article" });
        const second = await useCase.execute({ namespace: "cms.author" });

        expect(first?.id).toBe("workflow-1");
        expect(second).toBeNull();
        expect(gateway.listWorkflows).toHaveBeenCalledTimes(1);
        expect(gateway.listWorkflows).toHaveBeenCalledWith("cms");
    });

    it("shows a namespace that lost its workflow as null after the app's list was cleared", async () => {
        const article = createWorkflowDto("workflow-1", ["cms.article"]);
        gateway.listWorkflows.mockResolvedValueOnce([article]);
        gateway.listWorkflows.mockResolvedValueOnce([]);

        await useCase.execute({ namespace: "cms.article" });
        repository.invalidateWorkflows("cms");

        await expect(useCase.execute({ namespace: "cms.article" })).resolves.toBeNull();
    });

    it("lets a server error pass unchanged", async () => {
        const failure = new GraphQLOperationError({
            message: "No access.",
            code: "Workflows/NotAuthorized"
        });
        gateway.listWorkflows.mockRejectedValue(failure);

        await expect(useCase.execute({ namespace: "wb.page" })).rejects.toBe(failure);
    });
});
