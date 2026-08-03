import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { DeactivateThemeUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ThemeAfterDeactivateEvent } from "./events.js";
import { ActiveThemeStore } from "~/features/ActiveThemeStore/index.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";
import { ThemeNotAuthorizedError } from "~/domain/theme/errors.js";

class DeactivateThemeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: ThemePermissions.Interface,
        private eventPublisher: EventPublisher.Interface,
        private activeThemeStore: ActiveThemeStore.Interface
    ) {}

    async execute(): UseCaseAbstraction.Return {
        if (!(await this.permissions.canPublish("theme"))) {
            return Result.fail(new ThemeNotAuthorizedError());
        }

        const currentResult = await this.activeThemeStore.get();
        if (currentResult.isFail()) {
            return Result.fail(currentResult.error);
        }

        const previous = currentResult.value;

        const cleared = await this.activeThemeStore.clear();
        if (cleared.isFail()) {
            return Result.fail(cleared.error);
        }

        await this.eventPublisher.publish(new ThemeAfterDeactivateEvent({ previous }));

        return Result.ok({ previous });
    }
}

export const DeactivateThemeUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeactivateThemeUseCaseImpl,
    dependencies: [ThemePermissions, EventPublisher, ActiveThemeStore]
});
