import { Result } from "@webiny/feature/api";
import zod from "zod";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { AutomationDefinitionInfo } from "~/domain/config/types.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";
import { WorkflowEditorAccess } from "~/features/permissions/WorkflowEditorAccess/index.js";
import { ListAutomationDefinitionsUseCase as UseCase } from "./abstractions.js";

class ListAutomationDefinitionsUseCaseImpl implements UseCase.Interface {
    constructor(
        private editorAccess: WorkflowEditorAccess.Interface,
        private definitions: AutomationDefinitionRegistryService.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(): UseCase.Return {
        const access = await this.editorAccess.check("list automations");
        if (access.isFail()) {
            return Result.fail(access.error);
        }

        let rows: AutomationDefinitionInfo[];
        try {
            let droppedKeySetting = false;
            rows = this.definitions.list().map(definition => {
                // Input side (what the author fills in; a field with `.default()` is not
                // required). `unrepresentable: "any"`: one schema JSON schema cannot express
                // (a date) must not make the whole list throw (R138).
                const settingsSchema = zod.toJSONSchema(definition.settingsSchema, {
                    io: "input",
                    unrepresentable: "any"
                });
                let keySetting: string | null = null;
                if (definition.keySetting !== undefined) {
                    const properties = settingsSchema.properties;
                    if (
                        properties &&
                        typeof properties === "object" &&
                        Object.hasOwn(properties, definition.keySetting)
                    ) {
                        keySetting = definition.keySetting;
                    } else {
                        droppedKeySetting = true;
                    }
                }
                return {
                    id: definition.id,
                    name: definition.name,
                    models: [...definition.models],
                    settingsSchema,
                    keySetting
                };
            });
            if (droppedKeySetting) {
                this.logger.error(
                    "An automation definition names a key setting that is not a property of its settings schema."
                );
            }
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowPersistenceError(cause));
        }
        rows.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
        return Result.ok(rows);
    }
}

export const ListAutomationDefinitionsUseCase = UseCase.createImplementation({
    implementation: ListAutomationDefinitionsUseCaseImpl,
    dependencies: [WorkflowEditorAccess, AutomationDefinitionRegistryService, Logger]
});
