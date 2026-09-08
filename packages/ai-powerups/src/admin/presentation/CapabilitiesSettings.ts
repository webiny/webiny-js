import { AiPowerUpsSettingsGroup } from "./AiPowerUpsSettings/settingsGroup.js";
import {
    ListCapabilitiesUseCase,
    ListCapabilitiesRepository
} from "~/admin/features/listCapabilities/abstractions.js";
import {
    ListModelsUseCase,
    ListModelsRepository
} from "~/admin/features/listModels/abstractions.js";
import { AI_MODEL_ROLE_DISPLAY, roleLabel } from "./modelRoles.js";
import type { AiCapability } from "~/admin/features/listCapabilities/abstractions.js";
import type { FormModel, FormModelFactory } from "@webiny/app-admin";

interface ConnectionRow {
    id: string;
    name: string;
    sdkName: string;
}

/**
 * One row per AI feature, all of them empty by default.
 *
 * The rows come from the api's registered capabilities, so a feature that declares one appears here
 * without a change to this file. That is the point: the previous plan was a hand-maintained tab per
 * feature, which is the kind of list that stops matching reality on the second addition.
 */
class CapabilitiesSettingsImpl implements AiPowerUpsSettingsGroup.Interface {
    name = "capabilities";
    label = "Capabilities";
    description = "Per-feature model and prompt overrides. Empty means inherit.";

    constructor(
        private listCapabilities: ListCapabilitiesUseCase.Interface,
        private capabilitiesRepository: ListCapabilitiesRepository.Interface,
        private listModels: ListModelsUseCase.Interface,
        private modelsRepository: ListModelsRepository.Interface
    ) {}

    async init(): Promise<void> {
        await Promise.all([this.listCapabilities.execute(), this.listModels.execute()]);
    }

    buildForm(form: AiPowerUpsSettingsGroup.FormBuilder): void {
        form.fields(fields => ({
            overrides: fields
                .object()
                .label("Capabilities")
                .renderer("passthrough")
                .fields(f =>
                    Object.fromEntries(
                        this.capabilitiesRepository
                            .getCapabilities()
                            .map(capability => [
                                capability.id,
                                this.buildCapabilityField(f, capability)
                            ])
                    )
                )
        }));

        form.layout(layout => [layout.row("overrides")]);
    }

    private buildCapabilityField(
        f: FormModelFactory.FieldBuilderRegistry,
        capability: AiCapability
    ): FormModelFactory.FieldBuilder {
        const defaultRoleLabel = roleLabel(capability.defaultRole);

        return (
            f
                .object()
                .label(capability.label)
                /*
                 * Callbacks, not strings: a string is read as a field name, not as literal text. The
                 * title happened to survive that because the renderer falls back to the field label,
                 * but the description silently vanished.
                 */
                .renderer("objectAccordionSingle", {
                    itemTitle: () => capability.label,
                    itemDescription: () => capability.description,
                    // Closed by default. Every row is empty until someone changes something, so an
                    // expanded list of five would be five screens of nothing.
                    open: false
                })
                .fields(cf => ({
                    /*
                     * The inherited role goes in the description, not in the option list. An option
                     * with an empty value is dropped by the select renderer, so the "Inherit (Fast)"
                     * entry never rendered and nothing said which role this feature falls back to.
                     * Clearing the field is done with the select's own reset control.
                     */
                    roleId: cf
                        .text()
                        .label("Model role")
                        .description(
                            `Which role supplies this feature's model. Left empty, it uses ${defaultRoleLabel}.`
                        )
                        .options(() =>
                            AI_MODEL_ROLE_DISPLAY.map(role => ({
                                label: role.label,
                                value: role.id
                            }))
                        ),

                    /*
                     * Pinning a model bypasses roles for this one feature. It is the escape hatch, not
                     * the mechanism: a project that pins everything has thrown away the indirection
                     * that makes "switch our cheap model" a single edit.
                     */
                    connectionId: cf
                        .text()
                        .label("Pin a connection")
                        .description("Advanced. Overrides the role above for this feature only.")
                        .options(({ form }) => [
                            { label: "Use the role's connection", value: "" },
                            ...this.getConnections(form).map(c => ({ label: c.name, value: c.id }))
                        ]),
                    model: cf
                        .text()
                        .label("Pin a model")
                        .disabledWhen(({ form }) => !this.getPinnedConnection(form, capability.id))
                        .description(
                            "Both the connection and the model must be set for a pin to apply."
                        )
                        .options(({ form }) => this.getModelOptions(form, capability.id)),

                    additionalInstructions: cf
                        .text()
                        .label("Additional instructions")
                        .renderer("textarea", { rows: 5 })
                        .description(
                            "Appended to this feature's prompt. Use this for house style and standing rules."
                        )
                        .note(
                            "Appending is the safe option: you keep receiving prompt improvements from Webiny."
                        ),

                    /*
                     * A full replacement is offered only where the prompt is fixed text. Where the code
                     * assembles it per request (from a content model schema, say), letting someone
                     * replace it is just a way to break generation, so the field is not rendered.
                     */
                    ...(capability.guidance
                        ? {
                              replacePrompt: cf
                                  .boolean()
                                  .label("Replace the prompt entirely")
                                  .renderer("switch")
                                  .description(
                                      "Advanced. Your text replaces Webiny's prompt for this feature."
                                  )
                                  .note(
                                      "Once you replace it, improvements Webiny makes to this prompt no longer reach you. You own it from then on."
                                  ),
                              guidance: cf
                                  .text()
                                  .label("Prompt")
                                  .renderer("textarea", { rows: 14 })
                                  .hiddenWhen(({ form }) => !this.isReplacing(form, capability.id))
                                  .defaultValue(capability.guidance)
                                  .description(
                                      "The full prompt sent for this feature. Additional instructions are still appended below it."
                                  )
                          }
                        : {})
                }))
        );
    }

    private getConnections(form: FormModel.Interface): ConnectionRow[] {
        const data = form.getData() as { connections?: { presets?: ConnectionRow[] } };
        return (data.connections?.presets ?? []).filter(c => c.id && c.name);
    }

    private getOverride(
        form: FormModel.Interface,
        capabilityId: string
    ): { connectionId?: string; replacePrompt?: boolean } {
        const data = form.getData() as {
            capabilities?: {
                overrides?: Record<string, { connectionId?: string; replacePrompt?: boolean }>;
            };
        };
        return data.capabilities?.overrides?.[capabilityId] ?? {};
    }

    private isReplacing(form: FormModel.Interface, capabilityId: string): boolean {
        return this.getOverride(form, capabilityId).replacePrompt === true;
    }

    private getPinnedConnection(
        form: FormModel.Interface,
        capabilityId: string
    ): ConnectionRow | undefined {
        const connectionId = this.getOverride(form, capabilityId).connectionId;

        if (!connectionId) {
            return undefined;
        }

        return this.getConnections(form).find(c => c.id === connectionId);
    }

    private getModelOptions(form: FormModel.Interface, capabilityId: string) {
        const connection = this.getPinnedConnection(form, capabilityId);

        if (!connection) {
            return [];
        }

        return this.modelsRepository
            .getModels()
            .filter(model => model.providerId === connection.sdkName)
            .map(model => ({
                label: model.modelName,
                value: `${model.providerId}/${model.modelId}`
            }));
    }
}

export const CapabilitiesSettings = AiPowerUpsSettingsGroup.createImplementation({
    implementation: CapabilitiesSettingsImpl,
    dependencies: [
        ListCapabilitiesUseCase,
        ListCapabilitiesRepository,
        ListModelsUseCase,
        ListModelsRepository
    ]
});
