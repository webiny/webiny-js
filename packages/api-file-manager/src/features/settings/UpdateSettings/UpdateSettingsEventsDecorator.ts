import { Result } from "@webiny/feature/api";
import {
    UpdateSettingsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { GetSettingsUseCase } from "../GetSettings/abstractions.js";
import type { FileManagerSettings, UpdateSettingsInput } from "~/domain/settings/types.js";

/**
 * Event types for settings lifecycle
 */
export interface SettingsBeforeUpdateEvent {
    original: FileManagerSettings | null;
    settings: FileManagerSettings;
    input: UpdateSettingsInput;
}

export interface SettingsAfterUpdateEvent {
    original: FileManagerSettings | null;
    settings: FileManagerSettings;
    input: UpdateSettingsInput;
}

export interface SettingsUpdateErrorEvent {
    input: UpdateSettingsInput;
    error: Error;
}

class UpdateSettingsEventsDecoratorImpl implements UseCaseAbstraction.Interface {
    constructor(
        private useCase: UseCaseAbstraction.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getSettings: GetSettingsUseCase.Interface
    ) {}

    async execute(input: UpdateSettingsInput): Promise<Result<FileManagerSettings, UseCaseAbstraction.Error>> {
        // Get original settings
        const originalResult = await this.getSettings.execute();
        const original = originalResult.value;

        try {
            // Execute use case
            const result = await this.useCase.execute(input);

            if (result.isFail()) {
                // Publish error event
                await this.eventPublisher.publish<SettingsUpdateErrorEvent>({
                    type: "fileManager.settings.update.error",
                    data: {
                        input,
                        error: result.error
                    }
                });
                return result;
            }

            const settings = result.value;

            // Publish before event
            await this.eventPublisher.publish<SettingsBeforeUpdateEvent>({
                type: "fileManager.settings.update.before",
                data: {
                    original,
                    settings,
                    input
                }
            });

            // Publish after event
            await this.eventPublisher.publish<SettingsAfterUpdateEvent>({
                type: "fileManager.settings.update.after",
                data: {
                    original,
                    settings,
                    input
                }
            });

            return result;
        } catch (error) {
            // Publish error event for exceptions
            await this.eventPublisher.publish<SettingsUpdateErrorEvent>({
                type: "fileManager.settings.update.error",
                data: {
                    input,
                    error: error as Error
                }
            });
            throw error;
        }
    }
}

export const UpdateSettingsEventsDecorator = UseCaseAbstraction.createImplementation({
    implementation: UpdateSettingsEventsDecoratorImpl,
    dependencies: [UseCaseAbstraction, EventPublisher, GetSettingsUseCase]
});
