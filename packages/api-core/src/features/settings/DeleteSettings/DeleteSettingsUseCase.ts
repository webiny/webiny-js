import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { DeleteSettingsUseCase } from "./abstractions.js";
import { SettingsRepository } from "../shared/abstractions.js";
import { EventPublisher } from "~/features/eventPublisher/abstractions.js";
import { SettingsBeforeDeleteEvent, SettingsAfterDeleteEvent } from "./events.js";

class DeleteSettingsUseCaseImpl implements DeleteSettingsUseCase.Interface {
    constructor(
        private repository: SettingsRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(name: string): Promise<Result<void, DeleteSettingsUseCase.Error>> {
        // Get existing settings first (needed for events)
        const getResult = await this.repository.get(name);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const settings = getResult.value;

        // Publish before event
        await this.eventPublisher.publish(new SettingsBeforeDeleteEvent({ settings }));

        // Delete settings
        const deleteResult = await this.repository.delete(name);
        if (deleteResult.isFail()) {
            return Result.fail(deleteResult.error);
        }

        // Publish after event
        await this.eventPublisher.publish(new SettingsAfterDeleteEvent({ settings }));

        return Result.ok();
    }
}

export const DeleteSettingsUseCase = createImplementation({
    abstraction: DeleteSettingsUseCase,
    implementation: DeleteSettingsUseCaseImpl,
    dependencies: [SettingsRepository, EventPublisher]
});
