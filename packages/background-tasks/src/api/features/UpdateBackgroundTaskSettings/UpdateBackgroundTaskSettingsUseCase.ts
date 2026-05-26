import { Result } from "@webiny/feature/api";
import {
    UpdateBackgroundTaskSettingsRepository,
    UpdateBackgroundTaskSettingsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { UpdateBackgroundTaskSettingsInputSchema } from "./schema.js";
import {
    BackgroundTaskNotAuthorizedError,
    BackgroundTaskValidationError
} from "~/api/domain/errors.js";
import type { IBackgroundTaskSettings } from "~/api/domain/BackgroundTaskSettings.js";
import { BackgroundTaskPermissions } from "~/api/features/BackgroundTaskPermissions/abstractions.js";

class UpdateBackgroundTaskSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: BackgroundTaskPermissions.Interface,
        private readonly repository: UpdateBackgroundTaskSettingsRepository.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<IBackgroundTaskSettings, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canEdit("task"))) {
            return Result.fail(new BackgroundTaskNotAuthorizedError());
        }

        const parsed = UpdateBackgroundTaskSettingsInputSchema.safeParse(input);
        if (!parsed.success) {
            return Result.fail(new BackgroundTaskValidationError(parsed.error));
        }

        return this.repository.execute(parsed.data);
    }
}

export const UpdateBackgroundTaskSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateBackgroundTaskSettingsUseCaseImpl,
    dependencies: [BackgroundTaskPermissions, UpdateBackgroundTaskSettingsRepository]
});
