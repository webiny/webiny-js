import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { UpdateSettingsUseCase as UseCase } from "./abstractions.js";
import { SettingsRepository } from "../shared/abstractions.js";
import { EventPublisher } from "~/features/eventPublisher/abstractions.js";
import { type ISettings, SettingsModelFactory } from "~/domain/settings/index.js";
import type { IUpdateSettingsInput } from "../shared/types.js";
import { SettingsValidationError } from "../shared/errors.js";
import { SettingsBeforeUpdateEvent, SettingsAfterUpdateEvent } from "./events.js";

class UpdateSettingsUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: SettingsRepository.Interface,
        private eventPublisher: EventPublisher.Interface,
        private modelFactory: SettingsModelFactory.Interface
    ) {}

    async execute(input: IUpdateSettingsInput): Promise<Result<ISettings, UseCase.Error>> {
        // Validation
        if (!input.name || input.name.trim().length === 0) {
            return Result.fail(new SettingsValidationError("Settings name is required"));
        }

        if (!input.data || typeof input.data !== "object") {
            return Result.fail(new SettingsValidationError("Settings data must be an object"));
        }

        // Get existing settings for before event (if exists)
        const existingResult = await this.repository.get(input.name);

        let settings: ISettings;

        if (existingResult.isFail()) {
            if (existingResult.error.code !== "SETTINGS_NOT_FOUND") {
                return Result.fail(existingResult.error);
            }
            settings = await this.modelFactory.create({
                name: input.name,
                data: input.data
            });
        } else {
            settings = existingResult.value;
        }

        // Publish before event
        await this.eventPublisher.publish(
            new SettingsBeforeUpdateEvent({ settings, input: input.data })
        );

        // Update settings
        settings.updateWith({ data: { ...settings.data, ...input.data } });

        const result = await this.repository.update(settings);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        // Publish after event
        await this.eventPublisher.publish(new SettingsAfterUpdateEvent({ settings, input }));

        return Result.ok(settings);
    }
}

export const UpdateSettingsUseCase = createImplementation({
    abstraction: UseCase,
    implementation: UpdateSettingsUseCaseImpl,
    dependencies: [SettingsRepository, EventPublisher, SettingsModelFactory]
});
