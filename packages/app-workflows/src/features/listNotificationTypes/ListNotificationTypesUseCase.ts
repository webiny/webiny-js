import {
    ListNotificationTypesUseCase as UseCaseAbstraction,
    ListNotificationTypesGateway
} from "./abstractions.js";

class ListNotificationTypesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ListNotificationTypesGateway.Interface) {}

    async execute() {
        return this.gateway.execute();
    }
}

export const ListNotificationTypesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListNotificationTypesUseCaseImpl,
    dependencies: [ListNotificationTypesGateway]
});
