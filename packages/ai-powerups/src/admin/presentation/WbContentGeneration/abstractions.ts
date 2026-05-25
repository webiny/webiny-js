import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";

export type CreateElementParams = {
    componentName: string;
    parentId: string;
    slot: string;
    index?: number;
    bindings?: { inputs?: Record<string, unknown> };
};

export type CreateElementsFn = (elements: CreateElementParams[]) => void | Promise<void>;

export interface IGenerateContentVm {
    form: IFormVM | null;
    loading: boolean;
    submitting: boolean;
    processing: boolean;
    timedOut: boolean;
}

export interface IGenerateContentPresenter {
    readonly vm: IGenerateContentVm;
    init(components: Record<string, any>[], createElements: CreateElementsFn): void;
    submit(): Promise<void>;
    cancelPrompt(): void;
    processAiResponse(responseText: string): Promise<void>;
}

export const GenerateContentPresenter = createAbstraction<IGenerateContentPresenter>(
    "WbContentGeneration/Presenter"
);

export namespace GenerateContentPresenter {
    export type Interface = IGenerateContentPresenter;
    export type ViewModel = IGenerateContentVm;
}
