import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { UpdateSettingsUseCase, UpdateSettingsRepository } from "./abstractions.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";
import { AiPowerUpsPermissions } from "~/api/features/AiPowerUpsPermissions/abstractions.js";
import {
    AiPowerUpsSettingsBeforeUpdateEvent,
    AiPowerUpsSettingsAfterUpdateEvent
} from "./events.js";
import { SettingsNotAuthorizedError } from "./errors.js";

class UpdateSettingsUseCaseImpl implements UpdateSettingsUseCase.Interface {
    constructor(
        private permissions: AiPowerUpsPermissions.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateSettingsRepository.Interface
    ) {}

    async execute(input: IAiPowerUpsSettings): UpdateSettingsUseCase.Return {
        /*
         * Only the write is gated. Reading settings stays open because every AI feature resolves
         * its model and connection through them on the caller's behalf, and API keys are masked
         * before they leave the API.
         */
        const canManage = await this.permissions.canAccess("settings");
        if (!canManage) {
            return Result.fail(new SettingsNotAuthorizedError());
        }

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
    dependencies: [AiPowerUpsPermissions, EventPublisher, UpdateSettingsRepository]
});
