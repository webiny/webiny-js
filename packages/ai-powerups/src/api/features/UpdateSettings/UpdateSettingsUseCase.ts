import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { UpdateSettingsUseCase, UpdateSettingsRepository } from "./abstractions.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";
import {
    AiPowerUpsSettingsBeforeUpdateEvent,
    AiPowerUpsSettingsAfterUpdateEvent
} from "./events.js";

class UpdateSettingsUseCaseImpl implements UpdateSettingsUseCase.Interface {
    constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateSettingsRepository.Interface
    ) {}

    async execute(input: IAiPowerUpsSettings): UpdateSettingsUseCase.Return {
        await this.eventPublisher.publish(new AiPowerUpsSettingsBeforeUpdateEvent({ input }));

        const result = await this.repository.execute(input);

        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(
            new AiPowerUpsSettingsAfterUpdateEvent({ settings: result.value })
        );

        return result;
    }
}

export const UpdateSettingsUseCaseImplementation = UpdateSettingsUseCase.createImplementation({
    implementation: UpdateSettingsUseCaseImpl,
    dependencies: [EventPublisher, UpdateSettingsRepository]
});
