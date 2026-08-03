import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { UpdateThemeRepository, UpdateThemeUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ThemeAfterUpdateEvent, ThemeBeforeUpdateEvent } from "./events.js";
import { GetThemeByIdUseCase } from "~/features/GetThemeById/index.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";
import { ThemeNotAuthorizedError, ThemeValidationError } from "~/domain/theme/errors.js";

class UpdateThemeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: ThemePermissions.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getThemeById: GetThemeByIdUseCase.Interface,
        private repository: UpdateThemeRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        if (!(await this.permissions.canEdit("theme"))) {
            return Result.fail(new ThemeNotAuthorizedError());
        }

        // Fetching through the read use case inherits its authorization check.
        const existing = await this.getThemeById.execute(params.id);
        if (existing.isFail()) {
            return existing;
        }

        const original = existing.value;

        if (params.data.properties?.name !== undefined && !params.data.properties.name.trim()) {
            return Result.fail(new ThemeValidationError("A theme needs a name."));
        }

        await this.eventPublisher.publish(
            new ThemeBeforeUpdateEvent({ original, input: params.data })
        );

        const result = await this.repository.execute(params);
        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(
            new ThemeAfterUpdateEvent({ original, theme: result.value })
        );

        return Result.ok(result.value);
    }
}

export const UpdateThemeUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateThemeUseCaseImpl,
    dependencies: [ThemePermissions, EventPublisher, GetThemeByIdUseCase, UpdateThemeRepository]
});
