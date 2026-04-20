import { makeAutoObservable, computed } from "mobx";
import { z } from "zod";
import pick from "lodash/pick.js";
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import { ToolRegistry, ToolPipelineRunner } from "@webiny/app-admin";
import { GenerateContentPresenter, type CreateElementsFn } from "./abstractions.js";
import { toJS } from "mobx";
import { runInAction } from "mobx";

class GenerateContentPresenterImpl implements GenerateContentPresenter.Interface {
    private _prompt = "";
    private _submitting = false;
    private _components: Record<string, ComponentManifest> = {};
    private _createElements: CreateElementsFn = () => {};

    constructor(
        private toolRegistry: ToolRegistry.Interface,
        private pipelineRunner: ToolPipelineRunner.Interface
    ) {
        makeAutoObservable(this, { vm: computed }, { autoBind: true });
    }

    get vm(): GenerateContentPresenter.ViewModel {
        return {
            prompt: this._prompt,
            submitting: this._submitting
        };
    }

    init(components: Record<string, ComponentManifest>, createElements: CreateElementsFn): void {
        this._components = components;
        this._createElements = createElements;
    }

    setPrompt(value: string): void {
        this._prompt = value;
    }

    async submit(): Promise<void> {
        this._submitting = true;
        //
        await new Promise(resolve => {
            setTimeout(resolve, 1000);
        });

        runInAction(() => {
            this._submitting = false;
        });

        this.processAiResponse();
    }

    async processAiResponse() {
        const aiResponseJson = [
            {
                component: "Webiny/Lexical",
                inputs: {
                    content: {
                        tool: "textToLexical",
                        params: {
                            text: "<h2>The Remarkable World of Butterflies</h2><p>Butterflies are among the most <strong>visually stunning</strong> creatures in the animal kingdom, with over <em>17,000 known species</em> spread across every continent except Antarctica. Their wings, covered in thousands of microscopic scales, produce the vivid colors and patterns that make each species unique. Some, like the <strong>Monarch butterfly</strong>, are famous for their <em>extraordinary migration</em> — traveling up to 3,000 miles from Canada to central Mexico each autumn.</p><p>Key traits that make butterflies unique among insects:</p><ul><li><strong>Complete metamorphosis</strong> — a four-stage lifecycle from egg to adult</li><li><em>Scaled wings</em> that create color through both pigmentation and <strong>structural refraction</strong> of light</li><li>A coiled <strong>proboscis</strong> used for drinking nectar from deep within flowers</li><li>Compound eyes capable of seeing <em>ultraviolet light</em>, invisible to humans</li></ul><p>What makes butterflies truly fascinating is their <strong>complete metamorphosis</strong>. A caterpillar enters its chrysalis as a crawling, leaf-eating larva and emerges weeks later as an <em>entirely different organism</em>. The caterpillar's body is <strong>almost entirely dissolved</strong> and rebuilt from clusters of cells called <em>imaginal discs</em>, making it one of the most radical biological restructurings found in nature.</p>"
                        }
                    }
                }
            }
        ];
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
    }
}

export const GenerateContentPresenterRegistration = GenerateContentPresenter.createImplementation({
    implementation: GenerateContentPresenterImpl,
    dependencies: [ToolRegistry, ToolPipelineRunner]
});
