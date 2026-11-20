import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { AiPowerUpsPermissions } from "~/api/features/permissions/index.js";
import { UpdateSettingsUseCase, UpdateSettingsRepository } from "./abstractions.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";
import {
    AiPowerUpsSettingsBeforeUpdateEvent,
    AiPowerUpsSettingsAfterUpdateEvent
} from "./events.js";

class UpdateSettingsUseCaseImpl implements UpdateSettingsUseCase.Interface {
    constructor(
        private permissions: AiPowerUpsPermissions.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateSettingsRepository.Interface
    ) {}

    async execute(input: IAiPowerUpsSettings): UpdateSettingsUseCase.Return {
        // The settings hold the AI provider API keys.
        const canManageSettings = await this.permissions.canAccess("settings");
        if (!canManageSettings) {
            return Result.fail(new NotAuthorizedError());
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

export default UpdateSettingsUseCase.createImplementation({
    implementation: UpdateSettingsUseCaseImpl,
    dependencies: [AiPowerUpsPermissions, EventPublisher, UpdateSettingsRepository]
});
