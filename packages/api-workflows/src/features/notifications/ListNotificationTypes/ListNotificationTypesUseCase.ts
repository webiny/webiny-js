import {
    ListNotificationTypesRepository,
    ListNotificationTypesUseCase as UseCase
} from "./abstractions.js";

/**
 * Lists the registered notification transports. Internal (D132): reads no identity and checks no
 * permission; the shared transports operation checks `editor` (D133, R40).
 */
class ListNotificationTypesUseCaseImpl implements UseCase.Interface {
    public constructor(private repository: ListNotificationTypesRepository.Interface) {}

    public async execute(): UseCase.Return {
        return this.repository.execute();
    }
}

export const ListNotificationTypesUseCase = UseCase.createImplementation({
    implementation: ListNotificationTypesUseCaseImpl,
    dependencies: [ListNotificationTypesRepository]
});
