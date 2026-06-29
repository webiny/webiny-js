import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";

export interface ICmsGenerateContentVm {
    form: IFormVM | null;
    loading: boolean;
    submitting: boolean;
    timedOut: boolean;
    elapsedSeconds: number;
}

export interface ICmsGenerateContentPresenter {
    readonly vm: ICmsGenerateContentVm;
    init(): Promise<void>;
    submit(modelId: string): Promise<void>;
    cancelPrompt(): void;
    processAiResponse(responseText: string): Promise<Record<string, unknown>>;
}

export const CmsGenerateContentPresenter = createAbstraction<ICmsGenerateContentPresenter>(
    "CmsContentGeneration/Presenter"
);

export namespace CmsGenerateContentPresenter {
    export type Interface = ICmsGenerateContentPresenter;
    export type ViewModel = ICmsGenerateContentVm;
}
