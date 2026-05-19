import type { WebhookEvent } from "~/admin/shared/types.js";
import {
    ListAvailableEventsGateway,
    ListAvailableEventsUseCase as UseCaseAbstraction
} from "./abstractions.js";

class ListAvailableEventsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ListAvailableEventsGateway.Interface) {}

    async execute(): Promise<WebhookEvent[]> {
        return this.gateway.execute();
    }
}

export const ListAvailableEventsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAvailableEventsUseCaseImpl,
    dependencies: [ListAvailableEventsGateway]
});
