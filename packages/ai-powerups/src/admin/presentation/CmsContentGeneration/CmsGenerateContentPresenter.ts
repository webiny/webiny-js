import { makeAutoObservable, computed, runInAction } from "mobx";
import { FormModelFactory, ToolPipelineRunner } from "@webiny/app-admin";
import type { FormModel } from "@webiny/app-admin";
import { CmsGenerateContentPresenter as Abstraction } from "./abstractions.js";
import { GenerateEntryContentUseCase } from "~/admin/features/generateEntryContent/index.js";
import { GetSettingsUseCase } from "~/admin/features/settings/getSettings/abstractions.js";
import type { IAiPowerUpsSettings } from "~/admin/features/settings/shared/abstractions.js";

const SUBMIT_TIMEOUT_MS = 300_000;

class CmsGenerateContentPresenterImpl implements Abstraction.Interface {
    private _loading = false;
    private _submitting = false;
    private _timedOut = false;
    private _form: FormModel.Interface | null = null;
    private _settings: IAiPowerUpsSettings | null = null;
    private _timeoutId: ReturnType<typeof setTimeout> | null = null;
    private _intervalId: ReturnType<typeof setInterval> | null = null;
    private _elapsedSeconds = 0;

    constructor(
        private pipelineRunner: ToolPipelineRunner.Interface,
        private generateEntryContent: GenerateEntryContentUseCase.Interface,
        private formModelFactory: FormModelFactory.Interface,
        private getSettings: GetSettingsUseCase.Interface
    ) {
        makeAutoObservable(this, { vm: computed }, { autoBind: true });
    }

    get vm(): Abstraction.ViewModel {
        return {
            form: this._form ? this._form.vm : null,
            loading: this._loading,
            submitting: this._submitting,
            timedOut: this._timedOut,
            elapsedSeconds: this._elapsedSeconds
        };
    }

    async init(): Promise<void> {
        this._loading = true;

        try {
            const settings = await this.getSettings.execute();
            runInAction(() => {
                this._settings = settings;
                this._form = this.buildForm();
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    async submit(modelId: string): Promise<void> {
        if (!this._form) {
            return;
        }

        const data = await this._form.submit<{
            prompt: string;
            project?: string;
            includedFiles?: string[];
            readerPersona?: string;
            writerPersona?: string;
        }>();

        if (!data) {
            return;
        }

        runInAction(() => {
            this._submitting = true;
            this._timedOut = false;
        });

        this.startTimeout();

        try {
            const excludedFileIds = this.computeExcludedFileIds(data.project, data.includedFiles);

            await this.generateEntryContent.execute({
                prompt: data.prompt,
                modelId,
                projectId: data.project || null,
                excludedFileIds,
                readerPersonaId: data.readerPersona || null,
                writerPersonaId: data.writerPersona || null
            });
        } catch {
            this.clearTimeout();
            runInAction(() => {
                this._submitting = false;
            });
        }
    }

    async processAiResponse(responseText: string): Promise<Record<string, unknown>> {
        this.clearTimeout();
        runInAction(() => {
            this._submitting = false;
        });

        const aiResponseJson = JSON.parse(responseText);
        const resolved = await this.pipelineRunner.resolve(aiResponseJson);
        return resolved as Record<string, unknown>;
    }

    cancelPrompt(): void {
        this.clearTimeout();
        this._submitting = false;
    }

    private startTimeout(): void {
        this.clearTimeout();
        this._elapsedSeconds = 0;
        this._intervalId = setInterval(() => {
            runInAction(() => {
                this._elapsedSeconds++;
            });
        }, 1000);
        this._timeoutId = setTimeout(() => {
            runInAction(() => {
                this._submitting = false;
                this._timedOut = true;
            });
            this.clearInterval();
        }, SUBMIT_TIMEOUT_MS);
    }

    private clearTimeout(): void {
        if (this._timeoutId !== null) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }
        this.clearInterval();
    }

    private clearInterval(): void {
        if (this._intervalId !== null) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    private buildForm() {
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
                    .options(() => this.getProjectFileOptions())
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
                    .description("Describe the content you want to generate for this entry.")
                    .required("Prompt is required")
                    .renderer("textarea", { rows: 6 })
                    .defaultValue(
                        "Write an evaluation guide for enterprise, self-hosted CMS platform. Use at least 3 content blocks."
                    )
            }),
            layout: layout => [
                layout.row("project"),
                layout.row("includedFiles"),
                layout.row("readerPersona"),
                layout.row("writerPersona"),
                layout.row("prompt")
            ]
        });
    }

    private getSelectedProject() {
        if (!this._form || !this._settings) {
            return undefined;
        }
        const projectId = this._form.field("project").getValue<string>();
        if (!projectId) {
            return undefined;
        }
        return this._settings.projects?.presets?.find(p => p.id === projectId);
    }

    private getProjectFileOptions() {
        const project = this.getSelectedProject();
        const files = project?.files;
        if (!files || files.length === 0) {
            return [];
        }
        return files.map((f: { id: string; name: string }) => ({
            label: f.name,
            value: f.id
        }));
    }

    private computeExcludedFileIds(projectId?: string, includedFiles?: string[]): string[] | null {
        if (!projectId) {
            return null;
        }
        const project = this._settings?.projects?.presets?.find(p => p.id === projectId);
        const allFileIds = (project?.files ?? []).map((f: { id: string }) => f.id);
        if (allFileIds.length === 0) {
            return null;
        }
        const included = new Set(includedFiles ?? []);
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
}

export const CmsGenerateContentPresenter = Abstraction.createImplementation({
    implementation: CmsGenerateContentPresenterImpl,
    dependencies: [
        ToolPipelineRunner,
        GenerateEntryContentUseCase,
        FormModelFactory,
        GetSettingsUseCase
    ]
});
