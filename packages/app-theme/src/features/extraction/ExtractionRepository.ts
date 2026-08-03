import { makeAutoObservable, runInAction } from "mobx";
import { createAbstraction, createImplementation } from "@webiny/feature/admin";
import { ThemeGateway } from "~/features/themeGateway/index.js";
import type { ExtractThemeInputDto } from "~/features/themeGateway/abstractions.js";

/**
 * The state of one extraction run — see the design brief, screens 3 and 4.
 *
 * Progress arrives over websockets, which means the source of truth is a stream this repository does not
 * control and cannot replay. Two consequences shaped the design:
 *
 * The percentage is clamped monotonic here as well as on the server. Websocket delivery is not ordered,
 * so a late message from an earlier step would otherwise drag the bar backwards — and a bar going
 * backwards reads as a malfunction even when the work is fine.
 *
 * And a run is recoverable: the task id is kept so a page reload can ask the API where things got to,
 * because a five-minute job that loses its UI on an accidental refresh is a job the user assumes died.
 */

export type ExtractionPhase = "idle" | "running" | "failed" | "done";

export interface ExtractionUncertainty {
    path: string;
    reason: string;
}

export interface IExtractionRepository {
    readonly phase: ExtractionPhase;
    readonly taskId: string | null;
    readonly extractionId: string | null;
    readonly percent: number;
    readonly message: string;
    readonly error: string | null;
    readonly themeId: string | null;
    readonly summary: string | null;
    readonly confidence: string | null;
    readonly uncertain: ExtractionUncertainty[];

    start(data: ExtractThemeInputDto): Promise<void>;
    /** Called from the websocket subscription. */
    applyProgress(extractionId: string, percent: number, message: string): void;
    applyFailure(extractionId: string, message: string): void;
    applyDone(
        extractionId: string,
        result: {
            themeId: string;
            summary?: string;
            confidence?: string;
            uncertain?: ExtractionUncertainty[];
        }
    ): void;
    /** Reconciles against the API, for a reload or a missed stream. */
    refresh(): Promise<void>;
    cancel(): Promise<void>;
    reset(): void;
}

class ExtractionRepositoryImpl implements IExtractionRepository {
    phase: ExtractionPhase = "idle";
    taskId: string | null = null;
    extractionId: string | null = null;
    percent = 0;
    message = "";
    error: string | null = null;
    themeId: string | null = null;
    summary: string | null = null;
    confidence: string | null = null;
    uncertain: ExtractionUncertainty[] = [];

    constructor(private gateway: ThemeGateway.Interface) {
        makeAutoObservable(this);
    }

    async start(data: ExtractThemeInputDto) {
        runInAction(() => {
            this.phase = "running";
            this.percent = 0;
            this.message = "Starting…";
            this.error = null;
            this.themeId = null;
            this.summary = null;
            this.confidence = null;
            this.uncertain = [];
        });

        try {
            const started = await this.gateway.extract(data);
            runInAction(() => {
                this.taskId = started.taskId;
                this.extractionId = started.extractionId;
            });
        } catch (e) {
            runInAction(() => {
                this.phase = "failed";
                this.error =
                    e instanceof Error ? e.message : "The extraction could not be started.";
            });
        }
    }

    /**
     * Messages for a different run are ignored.
     *
     * The socket is per-identity, not per-extraction, so a run started in another browser tab would
     * otherwise drive this one's progress bar.
     */
    private isOurs(extractionId: string) {
        return this.extractionId !== null && extractionId === this.extractionId;
    }

    applyProgress(extractionId: string, percent: number, message: string) {
        if (!this.isOurs(extractionId) || this.phase !== "running") {
            return;
        }

        // Never backwards: websocket delivery is not ordered.
        this.percent = Math.max(this.percent, percent);
        this.message = message;
    }

    applyFailure(extractionId: string, message: string) {
        if (!this.isOurs(extractionId)) {
            return;
        }

        this.phase = "failed";
        this.error = message;
    }

    applyDone(
        extractionId: string,
        result: {
            themeId: string;
            summary?: string;
            confidence?: string;
            uncertain?: ExtractionUncertainty[];
        }
    ) {
        if (!this.isOurs(extractionId)) {
            return;
        }

        this.phase = "done";
        this.percent = 100;
        this.message = "Done.";
        this.themeId = result.themeId;
        this.summary = result.summary ?? null;
        this.confidence = result.confidence ?? null;
        this.uncertain = result.uncertain ?? [];
    }

    async refresh() {
        if (!this.taskId) {
            return;
        }

        try {
            const status = await this.gateway.getExtraction(this.taskId);

            runInAction(() => {
                if (status.state === "success" && status.themeId) {
                    this.phase = "done";
                    this.percent = 100;
                    this.themeId = status.themeId;
                    return;
                }

                if (status.state === "failed" || status.state === "aborted") {
                    this.phase = "failed";
                    this.error =
                        status.error ??
                        (status.state === "aborted"
                            ? "The extraction was cancelled."
                            : "The extraction failed.");
                    return;
                }

                this.phase = "running";
            });
        } catch {
            // A failed reconciliation is not itself a failed extraction — the websocket stream may still
            // be delivering. Leaving the phase alone is the honest response.
        }
    }

    async cancel() {
        if (!this.taskId) {
            this.reset();
            return;
        }

        try {
            await this.gateway.abortExtraction(this.taskId);
        } finally {
            // Reset regardless: the user asked to stop, and leaving a spinner running because the abort
            // call failed is the worst of both outcomes. The server-side lock is released by the task.
            this.reset();
        }
    }

    reset() {
        runInAction(() => {
            this.phase = "idle";
            this.taskId = null;
            this.extractionId = null;
            this.percent = 0;
            this.message = "";
            this.error = null;
            this.themeId = null;
            this.summary = null;
            this.confidence = null;
            this.uncertain = [];
        });
    }
}

export const ExtractionRepository = createAbstraction<IExtractionRepository>(
    "Theme/ExtractionRepository"
);

export namespace ExtractionRepository {
    export type Interface = IExtractionRepository;
    export type Phase = ExtractionPhase;
    export type Uncertainty = ExtractionUncertainty;
}

export const ExtractionRepositoryImplementation = createImplementation({
    abstraction: ExtractionRepository,
    implementation: ExtractionRepositoryImpl,
    dependencies: [ThemeGateway]
});
