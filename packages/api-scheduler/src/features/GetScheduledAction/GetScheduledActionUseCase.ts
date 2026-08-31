import { Result } from "@webiny/feature/api";
import { GetScheduledActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { IScheduledAction, IScheduledActionEntryValues } from "~/shared/abstractions.js";
import { ScheduledActionModel } from "~/shared/abstractions.js";
import {
    NotAuthorizedError,
    ScheduledActionNotFoundError,
    ScheduledActionPersistenceError
} from "~/domain/errors.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ScheduledActionIdWithVersion } from "~/domain/ScheduledActionIdWithVersion.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { SchedulerPermissionsResolver } from "~/features/permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { ScheduledActionMapper } from "~/domain/ScheduledActionMapper.js";

class GetScheduledActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getEntryByIdUseCase: GetEntryByIdUseCase.Interface,
        private model: ScheduledActionModel.Interface,
        private permissionsResolver: SchedulerPermissionsResolver.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute<T extends GenericRecord>(
        params: UseCaseAbstraction.Params
    ): Promise<Result<IScheduledAction<T>, UseCaseAbstraction.Error>> {
        const { id, namespace } = params;
        const permissions = this.permissionsResolver.forNamespace(namespace);
        if (permissions) {
            const hasPermission = await permissions.canRead();
            if (!hasPermission) {
                return Result.fail(new NotAuthorizedError());
            }
        }
        const scheduleId = ScheduledActionIdWithVersion.from(id);
        const entryResult = await this.getEntryByIdUseCase.execute<IScheduledActionEntryValues<T>>(
            this.model,
            scheduleId
        );

        if (entryResult.isFail()) {
            if (entryResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ScheduledActionNotFoundError(scheduleId));
            }

            return Result.fail(new ScheduledActionPersistenceError(entryResult.error));
        }

        const ownRecordsOnly = permissions ? await permissions.onlyOwnRecords() : false;
        if (ownRecordsOnly) {
            if (entryResult.value.createdBy.id !== this.identityContext.getIdentity().id) {
                return Result.fail(new NotAuthorizedError());
            }
        }

        const entry = entryResult.value;
        if (entry.values.namespace !== namespace) {
            return Result.fail(new ScheduledActionNotFoundError(scheduleId));
        }
        const action = ScheduledActionMapper.toAction<T>(entry);

        return Result.ok(action);
    }
}

export const GetScheduledActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetScheduledActionUseCaseImpl,
    dependencies: [
        GetEntryByIdUseCase,
        ScheduledActionModel,
        SchedulerPermissionsResolver,
        IdentityContext
    ]
});
