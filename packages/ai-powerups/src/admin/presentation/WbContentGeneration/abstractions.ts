import { createAbstraction } from "@webiny/feature/admin";
import type { ComponentManifest } from "@webiny/website-builder-sdk";

export type CreateElementParams = {
    componentName: string;
    parentId: string;
    slot: string;
    index?: number;
    bindings?: { inputs?: Record<string, unknown> };
};

export type CreateElementsFn = (elements: CreateElementParams[]) => void;

export interface IGenerateContentVm {
    prompt: string;
    submitting: boolean;
}

export interface IGenerateContentPresenter {
    readonly vm: IGenerateContentVm;
    init(components: Record<string, any>[], createElements: CreateElementsFn): void;
    setPrompt(value: string): void;
    submit(): Promise<void>;
    processAiResponse(responseText: string): Promise<void>;
}

export const GenerateContentPresenter = createAbstraction<IGenerateContentPresenter>(
    "WbContentGeneration/Presenter"
);

export namespace GenerateContentPresenter {
    export type Interface = IGenerateContentPresenter;
    export type ViewModel = IGenerateContentVm;
}
