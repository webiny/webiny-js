import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    UpdateSettingsUseCase,
    UpdateSettingsRepository,
    type UpdateSettingsInput
} from "./abstractions.js";
import {
    AiPowerUpsSettingsBeforeUpdateEvent,
    AiPowerUpsSettingsAfterUpdateEvent
} from "./events.js";
import { updateValidation } from "./validation.js";

class UpdateSettingsUseCaseImpl implements UpdateSettingsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateSettingsRepository.Interface
    ) {}

    async execute(input: UpdateSettingsInput): UpdateSettingsUseCase.Return {
        const permission = await this.identityContext.getPermission("ai-PowerUps");
        if (!permission) {
            return Result.fail(new Error("Not authorized to manage AI PowerUps settings."));
        }

        const validation = updateValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new Error(validation.error.issues[0].message));
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
