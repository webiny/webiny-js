import {
    ListNotificationTransportsRepository,
    ListNotificationTransportsUseCase as UseCase
} from "./abstractions.js";

/**
 * Lists the registered notification transports. Internal (D132): reads no identity and checks no
 * permission; the shared transports operation checks `editor` (D133, R40).
 */
class ListNotificationTransportsUseCaseImpl implements UseCase.Interface {
    public constructor(private repository: ListNotificationTransportsRepository.Interface) {}

    public async execute(): UseCase.Return {
        return this.repository.execute();
    }
}

export const ListNotificationTransportsUseCase = UseCase.createImplementation({
    implementation: ListNotificationTransportsUseCaseImpl,
    dependencies: [ListNotificationTransportsRepository]
});
