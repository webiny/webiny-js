import type { IAiPowerUpsConnectionPreset } from "~/admin/features/settings/shared/abstractions.js";
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

/**
 * Absent means enabled, exactly as it does in storage and in the resolver.
 *
 * The form seeds an untouched switch to `true`, so in practice this only reads `false` after someone
 * flips one. Spelled `!== false` anyway, so it keeps agreeing with the other two if that default
 * ever goes away.
 */
function isEnabled(form: FormModel.Interface, capabilityId: string): boolean {
    const data = form.getData() as {
        capabilities?: { items?: Record<string, { enabled?: boolean }> };
    };
    return data.capabilities?.items?.[capabilityId]?.enabled !== false;
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

    /**
     * Alphabetical by the label people actually read, not by id or registration order.
     *
     * Registration order is whatever the container happened to do, which puts "Page generation"
     * above "CMS entry generation" for no reason a reader could infer. `localeCompare` rather than
     * `<` so accented labels from an extension sort where a person would expect.
     */
    private sortedCapabilities(): AiCapability[] {
        return [...this.capabilitiesRepository.getCapabilities()].sort((a, b) =>
            a.label.localeCompare(b.label)
        );
    }

    buildForm(form: AiPowerUpsSettingsGroup.FormBuilder): void {
        form.fields(fields => ({
            items: fields
                .object()
                .label("Capabilities")
                .renderer("passthrough")
                .fields(f =>
                    Object.fromEntries(
                        this.sortedCapabilities().map(capability => [
                            capability.id,
                            this.buildCapabilityField(f, capability)
                        ])
                    )
                )
        }));

        form.layout(layout => [layout.row("items")]);
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
                     * On unless someone turns it off. A licence that grants a capability enables it
                     * immediately, so nobody has to come here and opt in; the only thing this
                     * records is a decision to switch one off.
                     */
                    enabled: cf
                        .boolean()
                        .label("Enabled")
                        /*
                         * On unless storage explicitly says otherwise. Nothing is written down for a
                         * capability a licence enabled, so the stored value is absent, and a switch
                         * renders absent as off. Without this default every untouched capability
                         * shows as disabled while actually running, which is the same `undefined`
                         * confusion the storage side guards against, seen from the front.
                         */
                        .defaultValue(true)
                        .description(
                            "Turn this off to remove the feature from the app. The settings below are kept, but ignored, while it is off."
                        ),

                    overrides: cf
                        .object()
                        .label("Overrides")
                        .renderer("passthrough")
                        .fields(of => ({
                            /*
                             * The inherited role goes in the description, not in the option list. An option
                             * with an empty value is dropped by the select renderer, so the "Inherit (Fast)"
                             * entry never rendered and nothing said which role this feature falls back to.
                             * Clearing the field is done with the select's own reset control.
                             */
                            roleId: of
                                .text()
                                .label("Model role")
                                .disabledWhen(({ form }) => !isEnabled(form, capability.id))
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
                            connectionId: of
                                .text()
                                .label("Pin a connection")
                                .disabledWhen(({ form }) => !isEnabled(form, capability.id))
                                .description(
                                    "Advanced. Overrides the role above for this feature only."
                                )
                                .options(({ form }) => [
                                    { label: "Use the role's connection", value: "" },
                                    ...this.getConnections(form).map(c => ({
                                        label: c.name,
                                        value: c.id
                                    }))
                                ]),
                            model: of
                                .text()
                                .label("Pin a model")
                                .disabledWhen(
                                    ({ form }) =>
                                        !isEnabled(form, capability.id) ||
                                        !this.getPinnedConnection(form, capability.id)
                                )
                                .description(
                                    "Both the connection and the model must be set for a pin to apply."
                                )
                                .options(({ form }) => this.getModelOptions(form, capability.id)),

                            additionalInstructions: of
                                .text()
                                .label("Additional instructions")
                                .renderer("textarea", { rows: 5 })
                                .disabledWhen(({ form }) => !isEnabled(form, capability.id))
                                .description(
                                    "Appended to this feature's prompt. Use this for house style and standing rules."
                                )
                                .note(
                                    "Appending keeps Webiny's prompt in place, including the output format the feature depends on."
                                )
                        }))
                }))
        );
    }

    private getConnections(form: FormModel.Interface): IAiPowerUpsConnectionPreset[] {
        const data = form.getData() as {
            connections?: { presets?: IAiPowerUpsConnectionPreset[] };
        };
        return (data.connections?.presets ?? []).filter(c => c.id && c.name);
    }

    private getOverride(
        form: FormModel.Interface,
        capabilityId: string
    ): { connectionId?: string } {
        const data = form.getData() as {
            capabilities?: { items?: Record<string, { overrides?: { connectionId?: string } }> };
        };
        return data.capabilities?.items?.[capabilityId]?.overrides ?? {};
    }

    private getPinnedConnection(
        form: FormModel.Interface,
        capabilityId: string
    ): IAiPowerUpsConnectionPreset | undefined {
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
