import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { reaction } from "mobx";
import { toJS } from "mobx";
import { FormModelFactory } from "@webiny/app-admin";
import type { FormModel } from "@webiny/app-admin";
import { jsonSchemaValueToFormData } from "@webiny/app-admin";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import { getStepTypeLabel } from "~/editor/model/getStepTypeLabel.js";
import { readAutomationConfig } from "~/editor/model/readAutomationConfig.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import { AI_FORM_MESSAGES } from "~/editor/presentation/stepForm/aiFormMessages.js";
import { buildAiStepForm } from "~/editor/presentation/stepForm/buildAiStepForm.js";
import { buildAutomationStepForm } from "~/editor/presentation/stepForm/buildAutomationStepForm.js";
import { buildPeopleStepForm } from "~/editor/presentation/stepForm/buildPeopleStepForm.js";
import { buildSwitchConfirmation } from "~/editor/presentation/stepForm/buildSwitchConfirmation.js";
import type { SwitchAutomationConfirmationVm } from "~/editor/presentation/stepForm/buildSwitchConfirmation.js";
import { createEmptyStepFormOptions } from "~/editor/presentation/stepForm/createEmptyStepFormOptions.js";
import { getAiFormData } from "~/editor/presentation/stepForm/getAiFormData.js";
import { getAiModelOptions } from "~/editor/presentation/stepForm/getAiModelOptions.js";
import { getAiStepPatch } from "~/editor/presentation/stepForm/getAiStepPatch.js";
import { getAutomationCards } from "~/editor/presentation/stepForm/getAutomationCards.js";
import { getAutomationEmptyText } from "~/editor/presentation/stepForm/getAutomationEmptyText.js";
import { getAutomationFormData } from "~/editor/presentation/stepForm/getAutomationFormData.js";
import { getAutomationStepPatch } from "~/editor/presentation/stepForm/getAutomationStepPatch.js";
import { getAutomationWarnings } from "~/editor/model/getAutomationWarnings.js";
import type { AutomationWarnings } from "~/editor/model/getAutomationWarnings.js";
import { getPeopleFormData } from "~/editor/presentation/stepForm/getPeopleFormData.js";
import { hasTeamSetting } from "~/editor/presentation/stepForm/hasTeamSetting.js";
import { getPeopleStepPatch } from "~/editor/presentation/stepForm/getPeopleStepPatch.js";
import { isNonEmptySettings } from "~/editor/model/isNonEmptySettings.js";
import { toTeamPickerOption } from "~/editor/presentation/stepForm/toTeamPickerOption.js";
import type { AiFormValues } from "~/editor/presentation/stepForm/StepFormData.js";
import type { AutomationFormValues } from "~/editor/presentation/stepForm/StepFormData.js";
import type { CommonFormValues } from "~/editor/presentation/stepForm/StepFormData.js";
import type { PeopleFormValues } from "~/editor/presentation/stepForm/StepFormData.js";
import type { StepFormOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import { StepDrawerPresenter as Abstraction } from "./abstractions.js";
import type { StepDrawerSource } from "./abstractions.js";
import type { StepKind } from "./abstractions.js";
import { getFormFieldPath } from "./getFormFieldPath.js";
import { getStepKind } from "./getStepKind.js";
import { STEP_DRAWER_MESSAGES } from "./stepDrawerMessages.js";

// A field marked with a step error and its value when it was marked.
interface MarkedField {
    path: string;
    message: string;
    value: string;
}

class StepDrawerPresenterImpl implements Abstraction.Interface {
    private source: StepDrawerSource | null = null;
    private stepId = "";
    private step: EditorStep | null = null;
    private kind: StepKind = "unknown";
    private form: FormModel.Interface | null = null;
    private topError: string | null = null;
    private pendingAutomationId: string | null = null;
    private storedSettings: unknown = undefined;
    private settingsBaseline = "null";
    private aiQuery = "";
    private stopWatching: Array<() => void> = [];
    private markedFields: MarkedField[] = [];

    constructor(private formModelFactory: FormModelFactory.Interface) {
        makeAutoObservable<
            StepDrawerPresenterImpl,
            | "formModelFactory"
            | "source"
            | "step"
            | "form"
            | "storedSettings"
            | "stopWatching"
            | "markedFields"
        >(this, {
            formModelFactory: false,
            source: observableRef,
            step: observableRef,
            form: observableRef,
            storedSettings: observableRef,
            stopWatching: false,
            markedFields: false
        });
    }

    get vm(): Abstraction.ViewModel {
        const source = this.source;
        const step = this.step;
        const open = source !== null && step !== null;

        let title = step ? step.title : "";
        const formTitle = this.getFieldText("title");
        if (formTitle !== null) {
            title = formTitle;
        }
        if (title.trim() === "") {
            title = STEP_DRAWER_MESSAGES.untitledStep;
        }

        let typeLabel = "";
        if (source !== null && step !== null) {
            typeLabel = getStepTypeLabel(step.type, source.getOptions().stepTypes.items);
        }

        const readOnly = this.isReadOnly();
        let licenceAlert: Abstraction.ViewModel["licenceAlert"] = null;
        if (this.kind === "ai" && readOnly) {
            licenceAlert = {
                title: AI_FORM_MESSAGES.licenceTitle,
                text: AI_FORM_MESSAGES.licenceText
            };
        }

        let switchConfirmation: Abstraction.ViewModel["switchConfirmation"] = null;
        if (this.pendingAutomationId !== null) {
            switchConfirmation = this.getSwitchConfirmation(this.pendingAutomationId);
        }

        return {
            open,
            kind: this.kind,
            typeLabel,
            title,
            subtitle: `${typeLabel} step · the type can't be changed`,
            footerText: STEP_DRAWER_MESSAGES.footerText,
            doneLabel: STEP_DRAWER_MESSAGES.done,
            readOnly,
            licenceAlert,
            topError: this.topError,
            form: this.form ? this.form.vm : null,
            switchConfirmation
        };
    }

    get formOptions(): StepFormOptions {
        const source = this.source;
        if (source === null) {
            return createEmptyStepFormOptions();
        }

        const options = source.getOptions();
        const teamOptions = source.getTeamOptions();
        const namespace = source.getNamespace();
        const automationId = this.getFieldString("automationId");
        const readOnly = this.isReadOnly();

        let warnings: AutomationWarnings = { warning: null, settingsWarning: null };
        if (options.automations.status === "ready") {
            warnings = getAutomationWarnings({
                definitions: options.automations.items,
                selectedId: automationId,
                storedSettings: this.storedSettings,
                settingsPristine: this.getSettingsJson() === this.settingsBaseline
            });
        }

        const models = getAiModelOptions({
            models: options.aiModels.items,
            loaded: options.aiModels.status === "ready" && !readOnly,
            query: this.aiQuery,
            selectedId: this.getFieldString("model")
        });

        // Every known team a team field holds: the People list, or a `ui: "team"` setting (R284).
        const heldIds = [...this.getSelectedTeamIds(), ...this.getSettingTeamIds()];
        const selectedTeams = teamOptions.known.filter(team => heldIds.includes(team.id));

        return {
            teams: {
                loading: teamOptions.loading,
                failed: teamOptions.failed,
                retry: () => {
                    void source.retryTeams();
                },
                options: teamOptions.results.map(toTeamPickerOption),
                selected: selectedTeams.map(toTeamPickerOption),
                search: query => source.searchTeams(query)
            },
            transports: {
                loading: options.transports.status === "loading",
                failed: options.transports.status === "failed",
                retry: () => {
                    void source.retryOptions();
                },
                options: options.transports.items.map(transport => {
                    return {
                        id: transport.id,
                        title: transport.title,
                        description: transport.description
                    };
                })
            },
            automations: {
                loading: options.automations.status === "loading",
                failed: options.automations.status === "failed",
                retry: () => {
                    void source.retryOptions();
                },
                options: getAutomationCards({
                    definitions: options.automations.items,
                    namespace,
                    selectedId: automationId
                }),
                emptyText: getAutomationEmptyText(namespace),
                warning: warnings.warning,
                settingsWarning: warnings.settingsWarning,
                select: id => this.requestAutomation(id)
            },
            aiModels: {
                loading: options.aiModels.status === "loading",
                failed: options.aiModels.status === "failed",
                retry: () => {
                    void source.retryOptions();
                },
                options: models.options,
                selected: models.selected,
                empty: models.empty,
                search: query => this.searchAiModels(query)
            },
            aiTools: {
                loading: options.aiTools.status === "loading",
                failed: options.aiTools.status === "failed",
                retry: () => {
                    void source.retryOptions();
                },
                options: options.aiTools.items.map(tool => {
                    return {
                        name: tool.name,
                        title: tool.title,
                        description: tool.description,
                        changesContent: tool.changesContent
                    };
                })
            }
        };
    }

    open(source: StepDrawerSource, stepId: string): void {
        this.reset();
        const step = source.getStep(stepId);
        if (step === null) {
            return;
        }

        this.source = source;
        this.stepId = stepId;
        this.step = toJS(step);
        this.kind = getStepKind(step.type);
        if (this.kind === "review") {
            source.searchTeams("");
        }

        this.buildForm();
        this.applyStepErrors(source.getStepFieldErrors(stepId));
        this.watch();
    }

    async done(): Promise<void> {
        const source = this.source;
        const form = this.form;
        if (source === null) {
            return;
        }
        if (form === null || this.isReadOnly()) {
            this.finish();
            return;
        }

        // An unfinished hex stays in the field and never reaches the draft (R273): keep the drawer open.
        const colourValid = await form.field("color").validate({ force: true });
        if (this.source !== source) {
            return;
        }
        if (!colourValid) {
            form.focusField("color");
            return;
        }

        this.apply();
        this.finish();
    }

    dismiss(): void {
        this.apply();
        this.finish();
    }

    close(): void {
        this.reset();
    }

    confirmSwitch(): void {
        const id = this.pendingAutomationId;
        this.setPendingAutomation(null);
        if (id !== null) {
            this.replaceAutomationForm(id, undefined, true);
        }
    }

    cancelSwitch(): void {
        this.setPendingAutomation(null);
    }

    dispose(): void {
        this.reset();
    }

    // Writes the edited form to the editor; nothing when it was not edited or the step is read-only.
    private apply(): void {
        const source = this.source;
        const step = this.step;
        const form = this.form;
        if (source === null || step === null || form === null || this.isReadOnly()) {
            return;
        }
        if (!form.isDirty) {
            return;
        }
        const patch = this.getPatch(step, form);
        source.updateStep(this.stepId, patch);
    }

    // Closes and tells the editor, so `vm.openStepId` becomes null (R284).
    private finish(): void {
        const source = this.source;
        this.reset();
        if (source !== null) {
            source.closeStep();
        }
    }

    private reset(): void {
        for (const stop of this.stopWatching) {
            stop();
        }
        this.stopWatching = [];
        this.markedFields = [];
        this.source = null;
        this.stepId = "";
        this.step = null;
        this.kind = "unknown";
        this.form = null;
        this.topError = null;
        this.pendingAutomationId = null;
        this.storedSettings = undefined;
        this.settingsBaseline = "null";
        this.aiQuery = "";
    }

    private isReadOnly(): boolean {
        if (this.source === null || this.step === null) {
            return false;
        }
        return this.source.isStepReadOnly(this.stepId);
    }

    private watch(): void {
        const source = this.source;
        if (source === null) {
            return;
        }

        // The first edit clears the message at the top (QBZ-11).
        const stopDirty = reaction(
            () => (this.form ? this.form.isDirty : false),
            dirty => {
                if (dirty) {
                    this.clearTopError();
                }
            }
        );
        // Definitions that arrive after the drawer opened: rebuild the automation form with its settings.
        const stopDefinitions = reaction(
            () => source.getOptions().automations.items,
            () => {
                if (this.kind === "automation") {
                    this.rebuildAutomationForm();
                    this.applyStepErrors(source.getStepFieldErrors(this.stepId));
                }
            }
        );
        // The step types arrive and the AI editor turns out to be missing (or present): rebuild the form.
        const stopReadOnly = reaction(
            () => source.isStepReadOnly(this.stepId),
            () => this.rebuildKeepingEdits()
        );
        // Editing a field marked with a step error clears that error (R276), for every field alike.
        const stopMarked = reaction(
            () => (this.form ? JSON.stringify(this.form.getData()) : ""),
            () => this.clearEditedMarks()
        );

        // The step is gone (deleted, workflow replaced): close and tell the editor.
        const stopStep = reaction(
            () => source.getStep(this.stepId) === null,
            gone => {
                if (gone) {
                    this.finish();
                }
            }
        );

        this.stopWatching = [stopDirty, stopDefinitions, stopReadOnly, stopStep, stopMarked];
    }

    private clearTopError(): void {
        this.topError = null;
    }

    private applyStepErrors(errors: StepFieldError[]): void {
        const form = this.form;
        let focused = false;
        this.markedFields = [];

        for (const error of errors) {
            const path = getFormFieldPath(error.field);
            if (path === null || form === null) {
                this.showTopError(error.message);
                continue;
            }
            try {
                form.field(path).setValidation({ isValid: false, message: error.message });
                this.markedFields.push({
                    path,
                    message: error.message,
                    value: this.readFieldJson(path)
                });
                if (!focused) {
                    form.focusField(path);
                    focused = true;
                }
            } catch {
                this.showTopError(error.message);
            }
        }
    }

    private clearEditedMarks(): void {
        const form = this.form;
        if (form === null) {
            return;
        }
        const remaining: MarkedField[] = [];
        for (const marked of this.markedFields) {
            if (this.readFieldJson(marked.path) === marked.value) {
                remaining.push(marked);
                continue;
            }
            // A validation that already replaced the server message stays.
            const field = form.field(marked.path);
            if (field.vm.validation.message === marked.message) {
                field.resetValidation();
            }
        }
        this.markedFields = remaining;
    }

    private readFieldJson(path: string): string {
        if (this.form === null) {
            return "";
        }
        let current: unknown = this.form.getData();
        for (const part of path.split(".")) {
            if (typeof current !== "object" || current === null) {
                return "";
            }
            current = (current as Record<string, unknown>)[part];
        }
        return JSON.stringify(current ?? null);
    }

    // The read-only state changed: rebuild the form and keep what was typed, its dirty state and the step's errors.
    private rebuildKeepingEdits(): void {
        const source = this.source;
        if (source === null) {
            return;
        }
        if (this.kind === "automation") {
            this.rebuildAutomationForm();
            this.applyStepErrors(source.getStepFieldErrors(this.stepId));
            return;
        }
        const previous = this.form;
        const data = previous ? previous.getData() : null;
        const dirty = previous ? previous.isDirty : false;
        this.buildForm();
        if (this.form !== null && data !== null) {
            this.form.setData(data, { dirty });
        }
        this.applyStepErrors(source.getStepFieldErrors(this.stepId));
    }

    private showTopError(message: string): void {
        if (this.topError === null) {
            this.topError = message;
        }
    }

    private buildForm(): void {
        const step = this.step;
        if (step === null) {
            return;
        }

        if (this.kind === "automation") {
            const config = readAutomationConfig(step.config);
            let automationId: string | null = null;
            if (config.automationId !== "") {
                automationId = config.automationId;
            }
            this.replaceAutomationForm(automationId, config.settings, false);
            return;
        }

        let values: CommonFormValues | null = null;
        let form: FormModel.Interface | null = null;
        if (this.kind === "review") {
            values = getPeopleFormData(step);
            form = this.formModelFactory.create(buildPeopleStepForm());
        }
        if (this.kind === "ai") {
            values = getAiFormData(step);
            form = this.formModelFactory.create(buildAiStepForm({ readOnly: this.isReadOnly() }));
        }
        if (values === null || form === null) {
            this.form = null;
            return;
        }

        form.setData(values, { dirty: false });
        this.form = form;
    }

    private replaceAutomationForm(
        automationId: string | null,
        settingsValue: unknown,
        dirty: boolean,
        typedSettings: unknown = null
    ): void {
        const step = this.step;
        if (step === null) {
            return;
        }

        const definition = this.findDefinition(automationId);
        const form = this.formModelFactory.create(buildAutomationStepForm({ definition }));
        const values: AutomationFormValues = getAutomationFormData(step, definition);
        if (this.form !== null) {
            const previous = this.form.getData() as AutomationFormValues;
            values.title = previous.title;
            values.color = previous.color;
            values.description = previous.description;
            values.notifications = previous.notifications;
        }
        values.automationId = automationId;
        values.settings = null;
        if (definition !== null && definition.settingsSchema !== null) {
            values.settings = jsonSchemaValueToFormData(definition.settingsSchema, settingsValue);
            if (typedSettings !== null) {
                values.settings = typedSettings as AutomationFormValues["settings"];
            }
        }
        const previousBaseline = this.settingsBaseline;

        form.setData(values, { dirty });
        if (
            definition !== null &&
            hasTeamSetting(definition.settingsSchema) &&
            this.source !== null
        ) {
            this.source.searchTeams("");
        }
        this.storedSettings = settingsValue;
        this.form = form;
        this.settingsBaseline = this.getSettingsJson();
        if (typedSettings !== null) {
            this.settingsBaseline = previousBaseline;
        }
        if (dirty) {
            this.clearTopError();
        }
    }

    private rebuildAutomationForm(): void {
        const wasDirty = this.form ? this.form.isDirty : false;
        let typedSettings: unknown = null;
        if (this.form !== null) {
            typedSettings = this.form.getData().settings ?? null;
        }
        this.replaceAutomationForm(
            this.getFieldString("automationId"),
            this.storedSettings,
            wasDirty,
            typedSettings
        );
    }

    private findDefinition(id: string | null): AutomationDefinition | null {
        if (id === null || this.source === null) {
            return null;
        }
        const definitions = this.source.getOptions().automations.items;
        return definitions.find(definition => definition.id === id) ?? null;
    }

    private getPatch(step: EditorStep, form: FormModel.Interface): EditorStepPatch {
        if (this.kind === "automation") {
            const values = form.getData() as AutomationFormValues;
            const definition = this.findDefinition(values.automationId);
            return getAutomationStepPatch(step, values, definition);
        }
        if (this.kind === "ai") {
            const values = form.getData() as AiFormValues;
            return getAiStepPatch(step, values);
        }
        const values = form.getData() as PeopleFormValues;
        return getPeopleStepPatch(step, values);
    }

    private getFieldString(name: string): string | null {
        if (this.form === null) {
            return null;
        }
        const data = this.form.getData();
        const value = data[name];
        if (typeof value === "string" && value !== "") {
            return value;
        }
        return null;
    }

    // The raw text of a form field, "" included (the title shows `Untitled step` when cleared).
    private getFieldText(name: string): string | null {
        if (this.form === null) {
            return null;
        }
        const data = this.form.getData();
        const value = data[name];
        if (typeof value === "string") {
            return value;
        }
        return null;
    }

    // The team ids held by `ui: "team"` settings of the open automation form.
    private getSettingTeamIds(): string[] {
        if (this.form === null || this.kind !== "automation") {
            return [];
        }
        const data = this.form.getData();
        const settings = data.settings;
        if (typeof settings !== "object" || settings === null) {
            return [];
        }
        return Object.values(settings).filter((value): value is string => {
            return typeof value === "string" && value !== "";
        });
    }

    private getSettingsJson(): string {
        if (this.form === null) {
            return "null";
        }
        const data = this.form.getData();
        return JSON.stringify(data.settings ?? null);
    }

    private getSelectedTeamIds(): string[] {
        if (this.form === null || this.kind !== "review") {
            return [];
        }
        const data = this.form.getData();
        if (Array.isArray(data.teams)) {
            return data.teams;
        }
        return [];
    }

    private getSwitchConfirmation(nextId: string): SwitchAutomationConfirmationVm {
        const next = this.findDefinition(nextId);
        const currentId = this.getFieldString("automationId");
        const current = this.findDefinition(currentId);

        const nextName = next ? next.name : nextId;
        let currentName = currentId ?? "";
        if (current) {
            currentName = current.name;
        }
        return buildSwitchConfirmation({ nextName, currentName });
    }

    private requestAutomation(id: string): void {
        if (id === this.getFieldString("automationId")) {
            return;
        }
        const hadSettings = isNonEmptySettings(this.storedSettings);
        const changed = this.getSettingsJson() !== this.settingsBaseline;
        if (hadSettings || changed) {
            this.setPendingAutomation(id);
            return;
        }
        this.replaceAutomationForm(id, undefined, true);
    }

    private setPendingAutomation(id: string | null): void {
        this.pendingAutomationId = id;
    }

    private searchAiModels(query: string): void {
        this.aiQuery = query;
    }
}

export const StepDrawerPresenter = Abstraction.createImplementation({
    implementation: StepDrawerPresenterImpl,
    dependencies: [FormModelFactory]
});
