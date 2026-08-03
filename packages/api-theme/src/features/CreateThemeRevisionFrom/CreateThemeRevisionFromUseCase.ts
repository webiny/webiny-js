import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    CreateThemeRevisionFromRepository,
    CreateThemeRevisionFromUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { ThemeAfterCreateRevisionFromEvent } from "./events.js";
import { GetThemeByIdUseCase } from "~/features/GetThemeById/index.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";
import { ThemeNotAuthorizedError } from "~/domain/theme/errors.js";

class CreateThemeRevisionFromUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: ThemePermissions.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getThemeById: GetThemeByIdUseCase.Interface,
        private repository: CreateThemeRevisionFromRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        if (!(await this.permissions.canEdit("theme"))) {
            return Result.fail(new ThemeNotAuthorizedError());
        }

        const found = await this.getThemeById.execute(params.id);
        if (found.isFail()) {
            return found;
        }

        const result = await this.repository.execute(params);
        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(
            new ThemeAfterCreateRevisionFromEvent({ original: found.value, theme: result.value })
        );

        return Result.ok(result.value);
    }
}

export const CreateThemeRevisionFromUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateThemeRevisionFromUseCaseImpl,
    dependencies: [
        ThemePermissions,
        EventPublisher,
        GetThemeByIdUseCase,
        CreateThemeRevisionFromRepository
    ]
});
