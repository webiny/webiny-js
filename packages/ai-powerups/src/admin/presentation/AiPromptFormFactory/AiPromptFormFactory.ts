import { makeAutoObservable, runInAction } from "mobx";
import { FormModelFactory } from "@webiny/app-admin";
import type { FormModel } from "@webiny/app-admin";
import { AiPromptFormFactory as Abstraction, type AiPromptFormConfig } from "./abstractions.js";
import { GetSettingsUseCase } from "~/admin/features/settings/getSettings/abstractions.js";
import type { IAiPowerUpsSettings } from "~/admin/features/settings/shared/abstractions.js";

class AiPromptFormFactoryImpl implements Abstraction.Interface {
    private _settings: IAiPowerUpsSettings | null = null;

    constructor(
        private formModelFactory: FormModelFactory.Interface,
        private getSettings: GetSettingsUseCase.Interface
    ) {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    createForm(config?: AiPromptFormConfig): FormModel.Interface {
        this.loadSettings();

        return this.formModelFactory.create({
            fields: fields => ({
                project: fields
                    .text()
                    .label("Project")
                    .description("Select a predefined context to attach.")
                    .options(() => this.getProjectOptions())
                    .afterChange((value, { form }) => {
                        const projectId = value as string | undefined;
                        const project = projectId
                            ? this._settings?.projects?.presets?.find(p => p.id === projectId)
                            : undefined;

                        if (project?.defaultReaderPersonaId) {
                            form.field("readerPersona").setValue(project.defaultReaderPersonaId);
                        }
                        if (project?.defaultWriterPersonaId) {
                            form.field("writerPersona").setValue(project.defaultWriterPersonaId);
                        }

                        const fileIds = (project?.files ?? []).map((f: { id: string }) => f.id);
                        form.field("includedFiles").setValue(fileIds);
                    }),
                includedFiles: fields
                    .text()
                    .label("Files included")
                    .description("Uncheck files to exclude them from this generation only.")
                    .options(({ form }) => this.getProjectFileOptions(form))
                    .renderer("multiSelect", { showSelectionCount: true })
                    .list()
                    .hiddenWhen(({ form }) => {
                        const projectId = form.field("project").as("text").getValue();
                        if (!projectId) {
                            return true;
                        }
                        const project = this._settings?.projects?.presets?.find(
                            p => p.id === projectId
                        );
                        return !project?.files || project.files.length === 0;
                    }),
                readerPersona: fields
                    .text()
                    .label("Reader Persona")
                    .description("Select the target audience for the generated content.")
                    .options(() => this.getPersonaOptions("reader")),
                writerPersona: fields
                    .text()
                    .label("Writer Persona")
                    .description("Select the writing style for the generated content.")
                    .options(() => this.getPersonaOptions("writer")),
                prompt: fields
                    .text()
                    .label("Prompt")
                    .description(
                        config?.promptDescription ?? "Describe the content you want to generate."
                    )
                    .required("Prompt is required")
                    .renderer("textarea", { rows: 6 })
                    .defaultValue(config?.promptDefaultValue ?? ""),
                additionalFiles: fields
                    .file()
                    .list()
                    .accept([
                        "text/*",
                        "application/pdf",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    ])
                    .label("Additional files")
                    .description("Attach files as one-off context for this generation.")
            }),
            layout: layout => [
                layout.row("project"),
                layout.row("includedFiles"),
                layout.row("readerPersona"),
                layout.row("writerPersona"),
                layout.row("prompt"),
                layout.row("additionalFiles")
            ]
        });
    }

    computeExcludedFileIds(form: FormModel.Interface): string[] | null {
        const projectId = form.field("project").getValue<string>();
        if (!projectId) {
            return null;
        }
        const project = this._settings?.projects?.presets?.find(p => p.id === projectId);
        const allFileIds = (project?.files ?? []).map((f: { id: string }) => f.id);
        if (allFileIds.length === 0) {
            return null;
        }
        const includedFiles = form.field("includedFiles").getValue<string[]>() ?? [];
        const included = new Set(includedFiles);
        const excluded = allFileIds.filter((id: string) => !included.has(id));
        return excluded.length > 0 ? excluded : null;
    }

    private getProjectOptions() {
        const presets = this._settings?.projects?.presets;
        if (!presets || presets.length === 0) {
            return [];
        }
        return presets.map(preset => ({
            label: preset.name,
            value: preset.id
        }));
    }

    private getPersonaOptions(type: "reader" | "writer") {
        const presets =
            type === "reader"
                ? this._settings?.readerPersonas?.presets
                : this._settings?.writerPersonas?.presets;

        if (!presets || presets.length === 0) {
            return [];
        }

        return presets.map(preset => ({
            label: preset.name,
            value: preset.id
        }));
    }

    private async loadSettings(): Promise<void> {
        const settings = await this.getSettings.execute();
        runInAction(() => {
            this._settings = settings;
        });
    }

    private getProjectFileOptions(form: FormModel.Interface) {
        const projectId = form.field("project").getValue<string>();
        if (!projectId) {
            return [];
        }
        const project = this._settings?.projects?.presets?.find(p => p.id === projectId);
        const files = project?.files;
        if (!files || files.length === 0) {
            return [];
        }
        return files.map((f: { id: string; name: string }) => ({
            label: f.name,
            value: f.id
        }));
    }
}

export const AiPromptFormFactory = Abstraction.createImplementation({
    implementation: AiPromptFormFactoryImpl,
    dependencies: [FormModelFactory, GetSettingsUseCase]
});
