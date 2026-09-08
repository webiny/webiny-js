import { AiPowerUpsSettingsGroup } from "./AiPowerUpsSettings/settingsGroup.js";
import {
    ListModelsUseCase,
    ListModelsRepository
} from "~/admin/features/listModels/abstractions.js";
import { AI_MODEL_ROLE_DISPLAY } from "./modelRoles.js";
import type { FormModel } from "@webiny/app-admin";

interface ConnectionRow {
    id: string;
    name: string;
    sdkName: string;
}

/**
 * Three selects, and for most projects this is the whole AI configuration: one connection, one
 * model per role. Everything else in these settings is opt-in.
 */
class ModelRolesSettingsImpl implements AiPowerUpsSettingsGroup.Interface {
    name = "modelRoles";
    label = "Model roles";
    description = "Which model does the cheap work, the main work, and the image work.";

    constructor(
        private useCase: ListModelsUseCase.Interface,
        private repository: ListModelsRepository.Interface
    ) {}

    async init(): Promise<void> {
        await this.useCase.execute();
    }

    buildForm(form: AiPowerUpsSettingsGroup.FormBuilder): void {
        form.fields(fields => ({
            roles: fields
                .object()
                .label("Roles")
                .renderer("passthrough")
                .fields(f =>
                    Object.fromEntries(
                        AI_MODEL_ROLE_DISPLAY.map(role => [
                            role.id,
                            f
                                .object()
                                .label(role.label)
                                .renderer("objectAccordionSingle", {
                                    itemTitle: role.label,
                                    itemDescription: role.description,
                                    open: true
                                })
                                .fields(rf => ({
                                    connectionId: rf
                                        .text()
                                        .label("Connection")
                                        .description("Which API key runs this role.")
                                        .options(({ form }) => this.getConnectionOptions(form)),
                                    model: rf
                                        .text()
                                        .label("Model")
                                        .description(
                                            "Only models from the selected connection's vendor are listed."
                                        )
                                        .disabledWhen(
                                            ({ form }) => !this.getSelectedConnection(form, role.id)
                                        )
                                        .options(({ form }) => this.getModelOptions(form, role.id))
                                }))
                        ])
                    )
                )
        }));

        form.layout(layout => [layout.row("roles")]);
    }

    private getConnections(form: FormModel.Interface): ConnectionRow[] {
        const data = form.getData() as {
            connections?: { presets?: ConnectionRow[] };
        };
        return data.connections?.presets ?? [];
    }

    private getConnectionOptions(form: FormModel.Interface) {
        return this.getConnections(form)
            .filter(c => c.id && c.name)
            .map(c => ({ label: c.name, value: c.id }));
    }

    private getSelectedConnection(
        form: FormModel.Interface,
        roleId: string
    ): ConnectionRow | undefined {
        const data = form.getData() as {
            modelRoles?: { roles?: Record<string, { connectionId?: string }> };
        };
        const connectionId = data.modelRoles?.roles?.[roleId]?.connectionId;

        if (!connectionId) {
            return undefined;
        }

        return this.getConnections(form).find(c => c.id === connectionId);
    }

    /**
     * Filtered by the chosen connection's vendor. Listing every model regardless would let someone
     * pair an OpenAI model with an Anthropic key, which then fails at request time with a provider
     * auth error that says nothing about the real mistake.
     */
    private getModelOptions(form: FormModel.Interface, roleId: string) {
        const connection = this.getSelectedConnection(form, roleId);

        if (!connection) {
            return [];
        }

        return this.repository
            .getModels()
            .filter(model => model.providerId === connection.sdkName)
            .map(model => ({
                label: model.modelName,
                value: `${model.providerId}/${model.modelId}`
            }));
    }
}

export const ModelRolesSettings = AiPowerUpsSettingsGroup.createImplementation({
    implementation: ModelRolesSettingsImpl,
    dependencies: [ListModelsUseCase, ListModelsRepository]
});
