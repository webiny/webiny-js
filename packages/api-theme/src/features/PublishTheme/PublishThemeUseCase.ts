import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { createResolvedSnapshot, validateForPublish } from "@webiny/theme-common";
import {
    PublishThemeRepository,
    PublishThemeUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { ThemeAfterPublishEvent, ThemeBeforePublishEvent } from "./events.js";
import { GetThemeByIdUseCase } from "~/features/GetThemeById/index.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";
import { ThemeNotAuthorizedError, ThemeNotPublishableError } from "~/domain/theme/errors.js";

class PublishThemeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: ThemePermissions.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getThemeById: GetThemeByIdUseCase.Interface,
        private repository: PublishThemeRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        if (!(await this.permissions.canPublish("theme"))) {
            return Result.fail(new ThemeNotAuthorizedError());
        }

        const found = await this.getThemeById.execute(params.id);
        if (found.isFail()) {
            return Result.fail(found.error);
        }

        const theme = found.value;

        // Validate first and return the whole blocker list as a domain error, so the UI can render
        // it as a checklist rather than a single message.
        const validation = validateForPublish(theme.tokens, theme.settings);
        if (validation.blockers.length > 0) {
            return Result.fail(new ThemeNotPublishableError(validation.blockers));
        }

        // Contrast and zoom warnings never block. They are recorded on the snapshot so the version
        // carries what it was warned about, and returned so the caller can report it.
        const resolved = createResolvedSnapshot({
            document: theme.tokens,
            policy: theme.policy,
            settings: theme.settings
        });

        await this.eventPublisher.publish(new ThemeBeforePublishEvent({ theme, resolved }));

        const result = await this.repository.execute({ id: params.id, resolved });
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new ThemeAfterPublishEvent({ theme: result.value, warnings: validation.warnings })
        );

        return Result.ok({ theme: result.value, warnings: validation.warnings });
    }
}

export const PublishThemeUseCase = UseCaseAbstraction.createImplementation({
    implementation: PublishThemeUseCaseImpl,
    dependencies: [ThemePermissions, EventPublisher, GetThemeByIdUseCase, PublishThemeRepository]
});
