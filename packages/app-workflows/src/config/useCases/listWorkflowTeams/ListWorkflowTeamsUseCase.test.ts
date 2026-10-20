import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import { WorkflowConfigRepository } from "~/config/repository/WorkflowConfigRepository.js";
import { createFakeConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import type { FakeWorkflowConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { ListWorkflowTeamsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWorkflowTeamsUseCase } from "./ListWorkflowTeamsUseCase.js";

const teamParams: UseCaseAbstraction.Params = { search: "ed", ids: null, limit: 20 };

describe("ListWorkflowTeamsUseCase", () => {
    let gateway: FakeWorkflowConfigGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeConfigGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigRepository).inSingletonScope();
        container.register(ListWorkflowTeamsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("lists the teams with the params passed through and the missing ids", async () => {
        gateway.listTeams.mockResolvedValue({
            teams: [createWorkflowTeamSummary({ memberCount: 0 })],
            missingIds: ["team-gone"]
        });

        const result = await useCase.execute(teamParams);

        expect(gateway.listTeams).toHaveBeenCalledTimes(1);
        expect(gateway.listTeams).toHaveBeenCalledWith(teamParams);
        expect(result.teams[0].memberCount).toBe(0);
        expect(result.missingIds).toEqual(["team-gone"]);
    });

    it("lets a server error of the gateway pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listTeams.mockRejectedValue(error);

        await expect(useCase.execute(teamParams)).rejects.toBe(error);
    });
});
