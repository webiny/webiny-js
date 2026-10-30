import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import type { RoutingTraceEntry } from "~/editor/domain/types.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import type { RoutingTraceEntryDto } from "~/editor/gateway/dto.js";
import { createRoutingInspection } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { InspectRoutingUseCase as UseCaseAbstraction } from "./abstractions.js";
import { InspectRoutingUseCase } from "./InspectRoutingUseCase.js";

const params: UseCaseAbstraction.Params = {
    app: "cms",
    stepConfig: {
        teams: ["team-1"],
        assignment: { strategy: "none", allowManualPick: false, rules: [] }
    },
    requesterId: "user-1",
    folderId: "folder-1",
    modelId: "article"
};

const dtoTrace: RoutingTraceEntryDto[] = [
    { ruleId: "rule-1", outcome: "notMatched", reason: null, failedConditions: ["folder"] },
    { ruleId: "rule-2", outcome: "notEvaluated", reason: null, failedConditions: [] }
];

const trace: RoutingTraceEntry[] = [
    { ruleId: "rule-1", outcome: "notMatched", reason: null, failedConditions: ["folder"] },
    { ruleId: "rule-2", outcome: "notEvaluated", reason: null, failedConditions: [] }
];

const createUseCase = (gateway: FakeWorkflowEditorGateway): UseCaseAbstraction.Interface => {
    const container = new Container();
    container.registerInstance(WorkflowEditorGateway, gateway);
    container.register(WorkflowEditorRepository).inSingletonScope();
    container.register(InspectRoutingUseCase);
    return container.resolve(UseCaseAbstraction);
};

describe("InspectRoutingUseCase", () => {
    it("passes the params untouched and maps the inspection", async () => {
        const gateway = createFakeEditorGateway();
        const dto = createRoutingInspectionDto({
            narrowedTeamId: "team-2",
            candidateIds: ["user-3", "user-4"],
            candidateCount: 5,
            trace: dtoTrace
        });
        gateway.inspectRouting.mockResolvedValue(dto);
        const expected = createRoutingInspection({
            narrowedTeamId: "team-2",
            candidateIds: ["user-3", "user-4"],
            candidateCount: 5,
            trace
        });
        const useCase = createUseCase(gateway);

        const inspection = await useCase.execute(params);

        expect(gateway.inspectRouting.mock.calls[0][0]).toBe(params);
        expect(inspection).toEqual(expected);
    });

    it("lets a rule validation error pass unchanged", async () => {
        const gateway = createFakeEditorGateway();
        const failure = new GraphQLOperationError({
            message: "The target team is not one of the step's reviewing teams.",
            code: WorkflowErrorCode.Validation,
            data: { stepId: "step-1", ruleId: "rule-1" }
        });
        gateway.inspectRouting.mockRejectedValue(failure);
        const useCase = createUseCase(gateway);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
