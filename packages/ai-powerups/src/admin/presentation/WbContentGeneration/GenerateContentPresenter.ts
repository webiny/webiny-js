import { makeAutoObservable, computed, toJS } from "mobx";
import { z } from "zod";
import pick from "lodash/pick.js";
import { ToolRegistry, ToolPipelineRunner } from "@webiny/app-admin";
import { GenerateContentPresenter, type CreateElementsFn } from "./abstractions.js";
import { GeneratePageContentUseCase } from "~/admin/features/generatePageContent/index.js";
import { runInAction } from "mobx";

class GenerateContentPresenterImpl implements GenerateContentPresenter.Interface {
    private _prompt = "";
    private _submitting = false;
    private _processing = false;
    private _components: Record<string, any>[] = [];
    private _createElements: CreateElementsFn = () => {};

    constructor(
        private toolRegistry: ToolRegistry.Interface,
        private pipelineRunner: ToolPipelineRunner.Interface,
        private generatePageContent: GeneratePageContentUseCase.Interface
    ) {
        makeAutoObservable(this, { vm: computed }, { autoBind: true });
    }

    get vm(): GenerateContentPresenter.ViewModel {
        return {
            prompt: this._prompt,
            submitting: this._submitting,
            processing: this._processing
        };
    }

    init(components: Record<string, any>[], createElements: CreateElementsFn): void {
        this._components = components;
        this._createElements = createElements;
    }

    setPrompt(value: string): void {
        this._prompt = value;
    }

    async submit(): Promise<void> {
        this._submitting = true;

        try {
            const tools = this.toolRegistry.getTools().map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: pick(z.toJSONSchema(tool.inputSchema), ["properties", "type"]),
                outputSchema: pick(z.toJSONSchema(tool.outputSchema), ["properties", "type"])
            }));

            await this.generatePageContent.execute({
                prompt: this._prompt,
                components: toJS(this._components),
                tools
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
}

export const GenerateContentPresenterRegistration = GenerateContentPresenter.createImplementation({
    implementation: GenerateContentPresenterImpl,
    dependencies: [ToolRegistry, ToolPipelineRunner, GeneratePageContentUseCase]
});
