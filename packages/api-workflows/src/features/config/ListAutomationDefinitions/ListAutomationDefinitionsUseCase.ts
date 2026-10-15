import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import zod from "zod";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { AutomationDefinitionInfo } from "~/domain/config/types.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListAutomationDefinitionsUseCase as UseCase } from "./abstractions.js";

const FAILURE_MESSAGE = "Could not list the automations.";
const FAILURE_LOG = "Could not list the automation definitions.";

class ListAutomationDefinitionsUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private definitions: AutomationDefinitionRegistryService.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            this.logger.error({ error }, FAILURE_LOG);
            return Result.fail(new WorkflowPersistenceError(new Error(FAILURE_MESSAGE)));
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list automations" }));
        }

        let rows: AutomationDefinitionInfo[];
        try {
            rows = this.definitions.list().map(definition => {
                return {
                    id: definition.id,
                    name: definition.name,
                    models: [...definition.models],
                    // Input side (what the author fills in; a field with `.default()` is not
                    // required). `unrepresentable: "any"`: one schema JSON schema cannot express
                    // (a date) must not make the whole list throw (R138).
                    settingsSchema: zod.toJSONSchema(definition.settingsSchema, {
                        io: "input",
                        unrepresentable: "any"
                    })
                };
            });
        } catch (error) {
            this.logger.error({ error }, FAILURE_LOG);
            return Result.fail(new WorkflowPersistenceError(new Error(FAILURE_MESSAGE)));
        }
        rows.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
        return Result.ok(rows);
    }
}

export const ListAutomationDefinitionsUseCase = UseCase.createImplementation({
    implementation: ListAutomationDefinitionsUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        AutomationDefinitionRegistryService,
        Logger
    ]
});
