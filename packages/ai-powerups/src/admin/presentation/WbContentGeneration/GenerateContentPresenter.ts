import { makeAutoObservable, computed, toJS, runInAction } from "mobx";
import { z } from "zod";
import pick from "lodash/pick.js";
import { FormModelFactory, FormModel, ToolRegistry, ToolPipelineRunner } from "@webiny/app-admin";
import { GenerateContentPresenter, type CreateElementsFn } from "./abstractions.js";
import { GeneratePageContentUseCase } from "~/admin/features/generatePageContent/index.js";
import { GetSettingsUseCase } from "~/admin/features/settings/getSettings/abstractions.js";
import type { IAiPowerUpsSettings } from "~/admin/features/settings/shared/abstractions.js";

class GenerateContentPresenterImpl implements GenerateContentPresenter.Interface {
    private _loading = false;
    private _submitting = false;
    private _processing = false;
    private _components: Record<string, any>[] = [];
    private _createElements: CreateElementsFn = () => {};
    private _form: FormModel.Interface | null = null;
    private _settings: IAiPowerUpsSettings | null = null;

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
            processing: this._processing
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
            readerPersona?: string;
            writerPersona?: string;
        }>();

        if (!data) {
            return;
        }

        this._submitting = true;

        try {
            const tools = this.toolRegistry.getTools().map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: pick(z.toJSONSchema(tool.inputSchema), ["properties", "type"]),
                outputSchema: pick(z.toJSONSchema(tool.outputSchema), ["properties", "type"])
            }));

            await this.generatePageContent.execute({
                prompt: data.prompt,
                components: toJS(this._components),
                tools,
                readerPersonaId: data.readerPersona || null,
                writerPersonaId: data.writerPersona || null
            });
        } catch {
            runInAction(() => {
                this._submitting = false;
            });
        }
    }

    async processAiResponse(responseText: string): Promise<void> {
        this._processing = true;
        this._submitting = false;

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
        this._processing = false;
        this._submitting = false;
    }

    private buildForm() {
        return this.formModelFactory.create({
            fields: fields => ({
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
                layout.row("readerPersona"),
                layout.row("writerPersona"),
                layout.row("prompt")
            ]
        });
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
