import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import { ListNotificationTransportsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListNotificationTransportsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowConfigRepository.Interface) {}

    public execute(): Promise<NotificationTransport[]> {
        return this.repository.listNotificationTransports();
    }
}

export const ListNotificationTransportsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListNotificationTransportsUseCaseImpl,
    dependencies: [WorkflowConfigRepository]
});
