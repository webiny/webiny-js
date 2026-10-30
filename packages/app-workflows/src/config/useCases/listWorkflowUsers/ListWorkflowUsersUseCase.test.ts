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
import { createWorkflowUserDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserListDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { ListWorkflowUsersUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWorkflowUsersUseCase } from "./ListWorkflowUsersUseCase.js";

const userParams: UseCaseAbstraction.Params = {
    search: "iv",
    ids: null,
    teamIds: ["team-1"],
    limit: 20
};

describe("ListWorkflowUsersUseCase", () => {
    let gateway: FakeWorkflowConfigGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeConfigGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigRepository).inSingletonScope();
        container.register(ListWorkflowUsersUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("lists the users with the params passed through, the team ids and the missing ids", async () => {
        gateway.listUsers.mockResolvedValue(
            createWorkflowUserListDto({
                users: [
                    createWorkflowUserDto({ id: "user-1", teamIds: ["team-1", "team-2"] }),
                    createWorkflowUserDto({ id: "user-2", displayName: "Maja Kos", teamIds: [] })
                ],
                missingIds: ["user-gone"]
            })
        );

        const result = await useCase.execute(userParams);

        expect(gateway.listUsers).toHaveBeenCalledTimes(1);
        expect(gateway.listUsers).toHaveBeenCalledWith(userParams);
        expect(result.users).toEqual([
            createWorkflowUserSummary({ id: "user-1", teamIds: ["team-1", "team-2"] }),
            createWorkflowUserSummary({ id: "user-2", displayName: "Maja Kos", teamIds: [] })
        ]);
        expect(result.missingIds).toEqual(["user-gone"]);
    });

    it("lets a server error of the gateway pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listUsers.mockRejectedValue(error);

        await expect(useCase.execute(userParams)).rejects.toBe(error);
    });
});
