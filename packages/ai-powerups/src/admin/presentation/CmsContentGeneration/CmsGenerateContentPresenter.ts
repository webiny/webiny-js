import { makeAutoObservable, computed, runInAction } from "mobx";
import { ToolPipelineRunner } from "@webiny/app-admin";
import type { FormModel } from "@webiny/app-admin";
import type { FileValue } from "@webiny/app-admin/features/formModel/abstractions.js";
import { CmsGenerateContentPresenter as Abstraction } from "./abstractions.js";
import { GenerateEntryContentUseCase } from "~/admin/features/generateEntryContent/index.js";
import { AiPromptFormFactory } from "~/admin/presentation/AiPromptFormFactory/abstractions.js";

const SUBMIT_TIMEOUT_MS = 300_000;

class CmsGenerateContentPresenterImpl implements Abstraction.Interface {
    private _loading = false;
    private _submitting = false;
    private _timedOut = false;
    private _form: FormModel.Interface | null = null;
    private _timeoutId: ReturnType<typeof setTimeout> | null = null;
    private _intervalId: ReturnType<typeof setInterval> | null = null;
    private _elapsedSeconds = 0;

    constructor(
        private pipelineRunner: ToolPipelineRunner.Interface,
        private generateEntryContent: GenerateEntryContentUseCase.Interface,
        private formFactory: AiPromptFormFactory.Interface
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
        this._form = this.formFactory.createForm({
            promptDescription: "Describe the content you want to generate for this entry.",
            promptDefaultValue:
                "Write an evaluation guide for enterprise, self-hosted CMS platform. Use at least 3 content blocks."
        });
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
            const excludedFileIds = this.formFactory.computeExcludedFileIds(this._form);
            const additionalFileIds = data.additionalFiles?.map(f => f.id) ?? null;

            await this.generateEntryContent.execute({
                prompt: data.prompt,
                modelId,
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
}

export const CmsGenerateContentPresenter = Abstraction.createImplementation({
    implementation: CmsGenerateContentPresenterImpl,
    dependencies: [ToolPipelineRunner, GenerateEntryContentUseCase, AiPromptFormFactory]
});
