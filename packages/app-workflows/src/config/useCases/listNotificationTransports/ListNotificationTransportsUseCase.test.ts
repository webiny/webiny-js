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
import { createNotificationTransport } from "~/editor/testing/editorFixtures.js";
import { ListNotificationTransportsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListNotificationTransportsUseCase } from "./ListNotificationTransportsUseCase.js";

describe("ListNotificationTransportsUseCase", () => {
    let gateway: FakeWorkflowConfigGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeConfigGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigRepository).inSingletonScope();
        container.register(ListNotificationTransportsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("lists the notification transports as they are", async () => {
        const transports = [
            createNotificationTransport(),
            createNotificationTransport({ id: "slack", title: "Slack", description: "Posts." })
        ];
        gateway.listNotificationTransports.mockResolvedValue(transports);

        const result = await useCase.execute();

        expect(gateway.listNotificationTransports).toHaveBeenCalledTimes(1);
        expect(result).toEqual(transports);
    });

    it("lets a server error of the gateway pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listNotificationTransports.mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toBe(error);
    });
});
