import { makeAutoObservable, computed, toJS, runInAction } from "mobx";
import { z } from "zod";
import pick from "lodash/pick.js";
import { ToolRegistry, ToolPipelineRunner } from "@webiny/app-admin";
import type { FormModel } from "@webiny/app-admin";
import type { FileValue } from "@webiny/app-admin/features/formModel/abstractions.js";
import { GenerateContentPresenter, type CreateElementsFn } from "./abstractions.js";
import { GeneratePageContentUseCase } from "~/admin/features/generatePageContent/index.js";
import { AiPromptFormFactory } from "~/admin/presentation/AiPromptFormFactory/abstractions.js";

const SUBMIT_TIMEOUT_MS = 300_000;

class GenerateContentPresenterImpl implements GenerateContentPresenter.Interface {
    private _loading = false;
    private _submitting = false;
    private _processing = false;
    private _timedOut = false;
    private _components: Record<string, any>[] = [];
    private _createElements: CreateElementsFn = () => {};
    private _form: FormModel.Interface | null = null;
    private _timeoutId: ReturnType<typeof setTimeout> | null = null;
    private _intervalId: ReturnType<typeof setInterval> | null = null;
    private _elapsedSeconds = 0;

    constructor(
        private toolRegistry: ToolRegistry.Interface,
        private pipelineRunner: ToolPipelineRunner.Interface,
        private generatePageContent: GeneratePageContentUseCase.Interface,
        private formFactory: AiPromptFormFactory.Interface
    ) {
        makeAutoObservable(this, { vm: computed }, { autoBind: true });
    }

    get vm(): GenerateContentPresenter.ViewModel {
        return {
            form: this._form ? this._form.vm : null,
            loading: this._loading,
            submitting: this._submitting,
            processing: this._processing,
            timedOut: this._timedOut,
            elapsedSeconds: this._elapsedSeconds
        };
    }

    async init(components: Record<string, any>[], createElements: CreateElementsFn): Promise<void> {
        this._components = components;
        this._createElements = createElements;

        this._form = this.formFactory.createForm({
            promptDescription: "Describe the page content you want to generate."
        });
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
            additionalFiles?: FileValue[];
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

            const excludedFileIds = this.formFactory.computeExcludedFileIds(this._form);
            const additionalFileIds = data.additionalFiles?.map(f => f.id) ?? null;

            await this.generatePageContent.execute({
                prompt: data.prompt,
                components: toJS(this._components),
                tools,
                projectId: data.project || null,
                excludedFileIds,
                readerPersonaId: data.readerPersona || null,
                writerPersonaId: data.writerPersona || null,
                additionalFileIds
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

            await this._createElements(
                items.map((element: { component: string; inputs: Record<string, unknown> }) => ({
                    componentName: element.component,
                    parentId: "root",
                    slot: "children",
                    bindings: { inputs: element.inputs }
                }))
            );
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
}

export const GenerateContentPresenterRegistration = GenerateContentPresenter.createImplementation({
    implementation: GenerateContentPresenterImpl,
    dependencies: [
        ToolRegistry,
        ToolPipelineRunner,
        GeneratePageContentUseCase,
        AiPromptFormFactory
    ]
});
