import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    SaveGlobalComponentRepository,
    SaveGlobalComponentUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { GlobalComponentAfterSaveEvent, GlobalComponentBeforeSaveEvent } from "./events.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";
import { GlobalComponentValidationError } from "~/domain/globals/errors.js";
import { GlobalComponentLanguage } from "~/domain/globals/GlobalComponentLanguage.js";
import { GlobalComponentDocument } from "~/domain/globals/GlobalComponentDocument.js";

class SaveGlobalComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private repository: SaveGlobalComponentRepository.Interface
    ) {}

    async execute(input: UseCaseAbstraction.Input): UseCaseAbstraction.Return {
        // Global components are part of every page, so changing them takes the same permission.
        const canEdit = await this.permissions.canEdit("page");
        if (!canEdit) {
            return Result.fail(new PageNotAuthorizedError());
        }

        const languageError = GlobalComponentLanguage.validate(input.language);
        if (languageError) {
            return Result.fail(new GlobalComponentValidationError(languageError));
        }

        const error = GlobalComponentDocument.from(input).validate();
        if (error) {
            return Result.fail(new GlobalComponentValidationError(error));
        }

        const globalComponent = {
            name: input.name,
            language: GlobalComponentLanguage.from(input.language).toString(),
            elements: input.elements,
            bindings: input.bindings
        };

        await this.eventPublisher.publish(
            new GlobalComponentBeforeSaveEvent({ input: globalComponent })
        );

        const result = await this.repository.execute(globalComponent);
        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(
            new GlobalComponentAfterSaveEvent({ globalComponent: result.value })
        );

        return result;
    }
}

export const SaveGlobalComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: SaveGlobalComponentUseCaseImpl,
    dependencies: [WbPermissions, EventPublisher, SaveGlobalComponentRepository]
});
