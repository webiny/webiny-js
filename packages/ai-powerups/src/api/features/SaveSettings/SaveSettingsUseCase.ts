import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    SaveSettingsUseCase,
    SaveSettingsRepository,
    type SaveSettingsInput
} from "./abstractions.js";
import { AiPowerupsSettingsBeforeSaveEvent, AiPowerupsSettingsAfterSaveEvent } from "./events.js";
import { saveValidation } from "./validation.js";

class SaveSettingsUseCaseImpl implements SaveSettingsUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: SaveSettingsRepository.Interface
    ) {}

    async execute(input: SaveSettingsInput): SaveSettingsUseCase.Return {
        const permission = await this.identityContext.getPermission("ai-powerups");
        if (!permission) {
            return Result.fail(new Error("Not authorized to manage AI Powerups settings."));
        }

        const validation = saveValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new Error(validation.error.issues[0].message));
        }

        await this.eventPublisher.publish(new AiPowerupsSettingsBeforeSaveEvent({ input }));

        const result = await this.repository.execute(input);

        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(
            new AiPowerupsSettingsAfterSaveEvent({ settings: result.value })
        );

        return result;
    }
}

export const SaveSettingsUseCaseImplementation = SaveSettingsUseCase.createImplementation({
    implementation: SaveSettingsUseCaseImpl,
    dependencies: [IdentityContext, EventPublisher, SaveSettingsRepository]
});
