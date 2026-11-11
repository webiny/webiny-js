import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowSettings } from "../types.js";
import type { WorkflowSettingsPersistenceError } from "../errors.js";

export interface IWorkflowSettingsRepository {
    /** Stored settings, including expired exclusions; empty when nothing was saved yet. */
    get(): Promise<Result<WorkflowSettings, WorkflowSettingsPersistenceError>>;
    /** Writes the whole record; the last save wins (D106). */
    save(
        settings: WorkflowSettings
    ): Promise<Result<WorkflowSettings, WorkflowSettingsPersistenceError>>;
}

export const WorkflowSettingsRepository = createAbstraction<IWorkflowSettingsRepository>(
    "WorkflowSettingsRepository"
);

export namespace WorkflowSettingsRepository {
    export type Interface = IWorkflowSettingsRepository;
}
