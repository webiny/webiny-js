import { makeAutoObservable, computed, toJS, runInAction } from "mobx";
import { z } from "zod";
import pick from "lodash/pick.js";
import { FormModelFactory, FormModel, ToolRegistry, ToolPipelineRunner } from "@webiny/app-admin";
import { GenerateContentPresenter, type CreateElementsFn } from "./abstractions.js";
import { GeneratePageContentUseCase } from "~/admin/features/generatePageContent/index.js";
import { GetSettingsUseCase } from "~/admin/features/settings/getSettings/abstractions.js";
import type { IAiPowerUpsSettings } from "~/admin/features/settings/shared/abstractions.js";

const SUBMIT_TIMEOUT_MS = 300_000;

class GenerateContentPresenterImpl implements GenerateContentPresenter.Interface {
    private _loading = false;
    private _submitting = false;
    private _processing = false;
    private _timedOut = false;
    private _components: Record<string, any>[] = [];
    private _createElements: CreateElementsFn = () => {};
    private _form: FormModel.Interface | null = null;
    private _settings: IAiPowerUpsSettings | null = null;
    private _timeoutId: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private toolRegistry: ToolRegistry.Interface,
        private pipelineRunner: ToolPipelineRunner.Interface,
        private generatePageContent: GeneratePageContentUseCase.Interface,
        private formModelFactory: FormModelFactory.Interface,
        private getSettings: GetSettingsUseCase.Interface
    ) {
        makeAutoObservable(this, { vm: computed }, { autoBind: true });
    }

    get vm(): GenerateContentPresenter.ViewModel {
        return {
            form: this._form ? this._form.vm : null,
            loading: this._loading,
            submitting: this._submitting,
            processing: this._processing,
            timedOut: this._timedOut
        };
    }

    async init(components: Record<string, any>[], createElements: CreateElementsFn): Promise<void> {
        this._components = components;
        this._createElements = createElements;

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

    async submit(): Promise<void> {
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
            const tools = this.toolRegistry.getTools().map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: pick(z.toJSONSchema(tool.inputSchema), ["properties", "type"]),
                outputSchema: pick(z.toJSONSchema(tool.outputSchema), ["properties", "type"])
            }));

            const excludedFileIds = this.computeExcludedFileIds(data.project, data.includedFiles);

            await this.generatePageContent.execute({
                prompt: data.prompt,
                components: toJS(this._components),
                tools,
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

    async processAiResponse(responseText: string): Promise<void> {
        this.clearTimeout();
        runInAction(() => {
            this._processing = true;
            this._submitting = false;
        });

        try {
            const aiResponseJson = JSON.parse(responseText);
            const resolved = await this.pipelineRunner.resolve(aiResponseJson);
            const items = Array.isArray(resolved) ? resolved : [resolved];

            this._createElements(
                items.map((element: { component: string; inputs: Record<string, unknown> }) => ({
                    componentName: element.component,
                    parentId: "root",
                    slot: "children",
                    bindings: { inputs: element.inputs }
                }))
            );
        } catch (e) {
            console.error(e);
        } finally {
            runInAction(() => {
                this._processing = false;
            });
        }
    }

    cancelPrompt(): void {
        this.clearTimeout();
        this._processing = false;
        this._submitting = false;
    }

    private startTimeout(): void {
        this.clearTimeout();
        this._timeoutId = setTimeout(() => {
            runInAction(() => {
                this._submitting = false;
                this._timedOut = true;
            });
        }, SUBMIT_TIMEOUT_MS);
    }

    private clearTimeout(): void {
        if (this._timeoutId !== null) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
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
                    .afterChange((value, form) => {
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

                        const fileIds = (project?.files ?? []).map(f => f.id);
                        form.field("includedFiles").setValue(fileIds);
                    }),
                includedFiles: fields
                    .text()
                    .label("Files included")
                    .description("Uncheck files to exclude them from this generation only.")
                    .options(() => this.getProjectFileOptions())
                    .renderer("checkboxes")
                    .list()
                    .hiddenWhen(form => {
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
                    .description("Describe the page content you want to generate.")
                    .required("Prompt is required")
                    .renderer("textarea", { rows: 6 })
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
        return files.map(f => ({
            label: f.name,
            value: f.id
        }));
    }

    private computeExcludedFileIds(projectId?: string, includedFiles?: string[]): string[] | null {
        if (!projectId) {
            return null;
        }
        const project = this._settings?.projects?.presets?.find(p => p.id === projectId);
        const allFileIds = (project?.files ?? []).map(f => f.id);
        if (allFileIds.length === 0) {
            return null;
        }
        const included = new Set(includedFiles ?? []);
        const excluded = allFileIds.filter(id => !included.has(id));
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

export const GenerateContentPresenterRegistration = GenerateContentPresenter.createImplementation({
    implementation: GenerateContentPresenterImpl,
    dependencies: [
        ToolRegistry,
        ToolPipelineRunner,
        GeneratePageContentUseCase,
        FormModelFactory,
        GetSettingsUseCase
    ]
});
