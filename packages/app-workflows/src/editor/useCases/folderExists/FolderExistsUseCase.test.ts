import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { FolderExistsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderExistsUseCase } from "./FolderExistsUseCase.js";

const params: UseCaseAbstraction.Params = { app: "cms", id: "folder-1", type: "cms:article" };

const createUseCase = (gateway: FakeWorkflowEditorGateway): UseCaseAbstraction.Interface => {
    const container = new Container();
    container.registerInstance(WorkflowEditorGateway, gateway);
    container.register(WorkflowEditorRepository).inSingletonScope();
    container.register(FolderExistsUseCase);
    return container.resolve(UseCaseAbstraction);
};

describe("FolderExistsUseCase", () => {
    it("passes the params untouched and answers true for a folder that exists", async () => {
        const gateway = createFakeEditorGateway();
        gateway.folderExists.mockResolvedValue(true);
        const useCase = createUseCase(gateway);

        const exists = await useCase.execute(params);

        expect(gateway.folderExists.mock.calls[0][0]).toBe(params);
        expect(exists).toBe(true);
    });

    it("answers false for a deleted folder", async () => {
        const gateway = createFakeEditorGateway();
        gateway.folderExists.mockResolvedValue(false);
        const useCase = createUseCase(gateway);

        const exists = await useCase.execute(params);

        expect(exists).toBe(false);
    });

    it("lets a transport failure pass unchanged", async () => {
        const gateway = createFakeEditorGateway();
        const failure = new Error("Network down.");
        gateway.folderExists.mockRejectedValue(failure);
        const useCase = createUseCase(gateway);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
