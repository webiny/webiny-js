import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    createDefaultPolicy,
    createDefaultSettings,
    createDefaultThemeDocument
} from "@webiny/theme-common";
import { THEME_SCHEMA_VERSION } from "~/constants.js";
import { CreateThemeRepository, CreateThemeUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ThemeAfterCreateEvent, ThemeBeforeCreateEvent } from "./events.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";
import { ThemeNotAuthorizedError, ThemeValidationError } from "~/domain/theme/errors.js";

class CreateThemeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: ThemePermissions.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: CreateThemeRepository.Interface
    ) {}

    async execute(input: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        if (!(await this.permissions.canCreate("theme"))) {
            return Result.fail(new ThemeNotAuthorizedError());
        }

        const name = input.properties?.name?.trim();
        if (!name) {
            return Result.fail(new ThemeValidationError("A theme needs a name."));
        }

        await this.eventPublisher.publish(new ThemeBeforeCreateEvent({ input }));

        // Anything the caller did not supply is seeded from the default theme, so every canonical
        // slot is filled from the moment the theme exists. The document is stamped with the current
        // schema version, so a future shape change can tell it apart from an older one.
        const result = await this.repository.execute({
            schemaVersion: THEME_SCHEMA_VERSION,
            properties: { ...input.properties, name },
            tokens: input.tokens ?? createDefaultThemeDocument(),
            policy: input.policy ?? createDefaultPolicy(),
            settings: input.settings ?? createDefaultSettings(),
            resolved: null,
            metadata: input.metadata ?? {},
            extensions: input.extensions ?? {}
        });

        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(new ThemeAfterCreateEvent({ theme: result.value }));

        return Result.ok(result.value);
    }
}

export const CreateThemeUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateThemeUseCaseImpl,
    dependencies: [ThemePermissions, EventPublisher, CreateThemeRepository]
});
