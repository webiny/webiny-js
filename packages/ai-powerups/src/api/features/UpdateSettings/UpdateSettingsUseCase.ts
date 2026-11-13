import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { UpdateSettingsUseCase, UpdateSettingsRepository } from "./abstractions.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";
import {
    AiPowerUpsSettingsBeforeUpdateEvent,
    AiPowerUpsSettingsAfterUpdateEvent
} from "./events.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";

class UpdateSettingsUseCaseImpl implements UpdateSettingsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateSettingsRepository.Interface
    ) {}

    async execute(input: IAiPowerUpsSettings): UpdateSettingsUseCase.Return {
        // The settings hold the AI provider API keys, so only full access may change them.
        const hasFullAccess = await this.identityContext.hasFullAccess();
        if (!hasFullAccess) {
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

export const UpdateSettingsUseCaseImplementation = UpdateSettingsUseCase.createImplementation({
    implementation: UpdateSettingsUseCaseImpl,
    dependencies: [IdentityContext, EventPublisher, UpdateSettingsRepository]
});
