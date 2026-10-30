import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { WorkflowSettingsModelProvider } from "~/domain/settings/abstractions/WorkflowSettingsModelProvider.js";
import { WorkflowSettingsRepository as Abstraction } from "~/domain/settings/abstractions/WorkflowSettingsRepository.js";
import { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";
import type { WorkflowSettings } from "~/domain/settings/types.js";
import { WORKFLOW_SETTINGS_ENTRY_ID } from "~/constants.js";
import {
    WorkflowSettingsEntryMapper,
    type WorkflowSettingsEntryValues
} from "./WorkflowSettingsEntryMapper.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";
const SETTINGS_REVISION_ID = createIdentifier({ id: WORKFLOW_SETTINGS_ENTRY_ID, version: 1 });

class WorkflowSettingsRepositoryImpl implements Abstraction.Interface {
    constructor(
        private modelProvider: WorkflowSettingsModelProvider.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface
    ) {}

    async get(): Promise<Result<WorkflowSettings, WorkflowSettingsPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.getEntryById.execute<WorkflowSettingsEntryValues>(
            model,
            SETTINGS_REVISION_ID
        );
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.ok({ exclusions: [] });
            }
            return Result.fail(new WorkflowSettingsPersistenceError(result.error));
        }
        return Result.ok(WorkflowSettingsEntryMapper.fromEntry(result.value));
    }

    async save(
        settings: WorkflowSettings
    ): Promise<Result<WorkflowSettings, WorkflowSettingsPersistenceError>> {
        const model = await this.modelProvider.get();
        const values = WorkflowSettingsEntryMapper.toValues(settings);

        const existing = await this.getEntryById.execute<WorkflowSettingsEntryValues>(
            model,
            SETTINGS_REVISION_ID
        );
        if (existing.isFail() && existing.error.code !== ENTRY_NOT_FOUND) {
            return Result.fail(new WorkflowSettingsPersistenceError(existing.error));
        }

        if (existing.isOk()) {
            const updated = await this.updateEntry.execute<WorkflowSettingsEntryValues>(
                model,
                SETTINGS_REVISION_ID,
                { values }
            );
            if (updated.isFail()) {
                return Result.fail(new WorkflowSettingsPersistenceError(updated.error));
            }
            return Result.ok(WorkflowSettingsEntryMapper.fromEntry(updated.value));
        }

        // Two concurrent first saves of a tenant can both reach this point; the second create fails
        // with Persistence (duplicate id) instead of winning (D106). Accepted: settings are edited
        // rarely, by editors, and a retry succeeds as an update.
        const created = await this.createEntry.execute<WorkflowSettingsEntryValues>(model, {
            id: WORKFLOW_SETTINGS_ENTRY_ID,
            values
        });
        if (created.isFail()) {
            return Result.fail(new WorkflowSettingsPersistenceError(created.error));
        }
        return Result.ok(WorkflowSettingsEntryMapper.fromEntry(created.value));
    }
}

export const WorkflowSettingsRepository = Abstraction.createImplementation({
    implementation: WorkflowSettingsRepositoryImpl,
    dependencies: [
        WorkflowSettingsModelProvider,
        GetEntryByIdUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase
    ]
});
