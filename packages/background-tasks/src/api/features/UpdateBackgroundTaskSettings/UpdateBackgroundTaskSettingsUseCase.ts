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
import { checkPermissions } from "~/api/graphql/checkPermissions.js";
import type { Context } from "~/api/types.js";

export class UpdateBackgroundTaskSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly context: Context,
        private readonly repository: UpdateBackgroundTaskSettingsRepository.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<IBackgroundTaskSettings, UseCaseAbstraction.Error>> {
        try {
            await checkPermissions(this.context, { rwd: "w" });
        } catch {
            return Result.fail(new BackgroundTaskNotAuthorizedError());
        }

        const parsed = UpdateBackgroundTaskSettingsInputSchema.safeParse(input);
        if (!parsed.success) {
            return Result.fail(new BackgroundTaskValidationError(parsed.error));
        }

        return this.repository.execute(parsed.data);
    }
}
