import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ActivateThemeUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ThemeAfterActivateEvent, ThemeBeforeActivateEvent } from "./events.js";
import { ActiveThemeStore } from "~/features/ActiveThemeStore/index.js";
import { GetThemeByIdUseCase } from "~/features/GetThemeById/index.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";
import { ThemeNeverPublishedError, ThemeNotAuthorizedError } from "~/domain/theme/errors.js";

class ActivateThemeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: ThemePermissions.Interface,
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getThemeById: GetThemeByIdUseCase.Interface,
        private activeThemeStore: ActiveThemeStore.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Activation is gated on publish: making a version live is the same class of act.
        if (!(await this.permissions.canPublish("theme"))) {
            return Result.fail(new ThemeNotAuthorizedError());
        }

        const found = await this.getThemeById.execute(params.id);
        if (found.isFail()) {
            return Result.fail(found.error);
        }

        const theme = found.value;

        // The gate is "has a frozen snapshot", NOT "the CMS currently marks this revision
        // published". Publishing v2 flips v1 to `unpublished`, but v1's snapshot is immutable and it
        // remains a valid rollback target — which is exactly what rollback is: activating an older
        // version directly. Gating on CMS status would make rollback impossible.
        if (!theme.resolved) {
            return Result.fail(new ThemeNeverPublishedError(theme.id, theme.status));
        }

        const currentResult = await this.activeThemeStore.get();
        if (currentResult.isFail()) {
            return Result.fail(currentResult.error);
        }

        const previous = currentResult.value;

        await this.eventPublisher.publish(new ThemeBeforeActivateEvent({ theme, previous }));

        const identity = this.identityContext.getIdentity();
        const pointer = {
            entryId: theme.entryId,
            id: theme.id,
            version: theme.version,
            activatedOn: new Date().toISOString(),
            activatedBy: {
                id: identity.id,
                displayName: identity.displayName ?? null,
                type: identity.type
            }
        };

        const stored = await this.activeThemeStore.set(pointer);
        if (stored.isFail()) {
            return Result.fail(stored.error);
        }

        // Revalidation downstream is asynchronous, so activation is near-instant rather than atomic
        // and a page mid-flight can serve the previous theme briefly. That is documented behaviour.
        await this.eventPublisher.publish(
            new ThemeAfterActivateEvent({ theme, pointer, previous })
        );

        return Result.ok({ theme, pointer, previous });
    }
}

export const ActivateThemeUseCase = UseCaseAbstraction.createImplementation({
    implementation: ActivateThemeUseCaseImpl,
    dependencies: [
        ThemePermissions,
        IdentityContext,
        EventPublisher,
        GetThemeByIdUseCase,
        ActiveThemeStore
    ]
});
