import { makeAutoObservable, runInAction } from "mobx";
import { WebLlmService as Abstraction, type WebLlmStatus } from "./abstractions.js";
import type { MLCEngineInterface, InitProgressReport } from "@mlc-ai/web-llm";

export const MODEL_ID = "Hermes-2-Pro-Mistral-7B-q4f16_1-MLC";

class WebLlmServiceImpl implements Abstraction.Interface {
    status: WebLlmStatus = "idle";
    engine: MLCEngineInterface | null = null;
    progress: InitProgressReport | null = null;
    error: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    async loadModel(modelId?: string): Promise<void> {
        if (this.status === "loading" || this.status === "ready") {
            return;
        }

        runInAction(() => {
            this.status = "loading";
            this.error = null;
            this.progress = null;
        });

        try {
            const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");

            const worker = new Worker(new URL("./worker.ts", import.meta.url), {
                type: "module"
            });

            const engine = await CreateWebWorkerMLCEngine(worker, modelId || MODEL_ID, {
                initProgressCallback: (report: InitProgressReport) => {
                    runInAction(() => {
                        this.progress = report;
                    });
                }
            });

            runInAction(() => {
                this.engine = engine;
                this.status = "ready";
            });
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : String(err);
                this.status = "error";
            });
        }
    }

    async unloadModel(): Promise<void> {
        if (this.engine) {
            await this.engine.unload();
            runInAction(() => {
                this.engine = null;
                this.status = "idle";
                this.progress = null;
                this.error = null;
            });
        }
    }
}

export const WebLlmServiceRegistration = Abstraction.createImplementation({
    implementation: WebLlmServiceImpl,
    dependencies: []
});
