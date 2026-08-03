import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { DeleteThemeRepository, DeleteThemeUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ThemeAfterDeleteEvent, ThemeBeforeDeleteEvent } from "./events.js";
import { ActiveThemeStore } from "~/features/ActiveThemeStore/index.js";
import { GetThemeByIdUseCase } from "~/features/GetThemeById/index.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";
import { ThemeIsActiveError, ThemeNotAuthorizedError } from "~/domain/theme/errors.js";

class DeleteThemeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: ThemePermissions.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getThemeById: GetThemeByIdUseCase.Interface,
        private activeThemeStore: ActiveThemeStore.Interface,
        private repository: DeleteThemeRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Fetch before the permission check so ownership-aware checks have an item to work with.
        // The read use case enforces `canRead` on the way through.
        const found = await this.getThemeById.execute(params.id);
        if (found.isFail()) {
            // Re-wrap rather than returning: this use case resolves to void, so the success type of
            // the incoming Result does not match.
            return Result.fail(found.error);
        }

        const theme = found.value;

        if (!(await this.permissions.canDelete("theme", theme))) {
            return Result.fail(new ThemeNotAuthorizedError());
        }

        // Deleting the active theme would leave the live site pointing at nothing.
        const pointerResult = await this.activeThemeStore.get();
        if (pointerResult.isFail()) {
            return Result.fail(pointerResult.error);
        }
        if (pointerResult.value?.entryId === theme.entryId) {
            return Result.fail(new ThemeIsActiveError(theme.entryId));
        }

        await this.eventPublisher.publish(new ThemeBeforeDeleteEvent({ theme }));

        const result = await this.repository.execute(params);
        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(new ThemeAfterDeleteEvent({ theme }));

        return Result.ok();
    }
}

export const DeleteThemeUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteThemeUseCaseImpl,
    dependencies: [
        ThemePermissions,
        EventPublisher,
        GetThemeByIdUseCase,
        ActiveThemeStore,
        DeleteThemeRepository
    ]
});
