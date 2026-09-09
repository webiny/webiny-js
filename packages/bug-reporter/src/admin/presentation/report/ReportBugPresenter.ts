import { makeAutoObservable } from "mobx";
import { ActionRecorder } from "../../recording/abstractions.js";
import type { IRecordedEvent } from "../../recording/abstractions.js";
import { collectEnvironment } from "../../capture/collectEnvironment.js";
import { SubmitBugReportGateway } from "../../gateway/abstractions.js";
import { SpeechDictation } from "../../speech/abstractions.js";
import { ReportBugPresenter as Abstraction } from "./abstractions.js";
import type { IReportBugOutcomeVm } from "./abstractions.js";
import type { IReportBugViewModel } from "./abstractions.js";
import type { IReportedEnvironment } from "../../../shared/types.js";
import type { IReportedScreenshot } from "../../../shared/types.js";

function describeFailure(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

/*
 * Splits `data:image/png;base64,AAAA` into the parts the API wants. Returns null for anything
 * that isn't a base64 data URL, so a malformed attachment is dropped rather than sent.
 */
function parseDataUrl(dataUrl: string): IReportedScreenshot | null {
    const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl);
    if (!match) {
        return null;
    }

    const mediaType = match[1];
    const base64 = match[2];

    if (!mediaType || !base64) {
        return null;
    }

    return { mediaType, base64 };
}

class ReportBugPresenterImpl implements Abstraction.Interface {
    private isOpen = false;
    private description = "";
    private listening = false;
    private screenshots: string[] = [];
    private events: IRecordedEvent[] = [];
    private environment: IReportedEnvironment | null = null;
    private capturedAt = 0;
    private status: string | null = null;
    private error: string | null = null;
    private outcome: IReportBugOutcomeVm | null = null;
    private controller: AbortController | null = null;

    constructor(
        private recorder: ActionRecorder.Interface,
        private gateway: SubmitBugReportGateway.Interface,
        private dictation: SpeechDictation.Interface
    ) {
        // `controller` is machinery, not state anything renders, so it stays out of the map.
        makeAutoObservable<
            ReportBugPresenterImpl,
            "recorder" | "gateway" | "dictation" | "controller"
        >(this, {
            recorder: false,
            gateway: false,
            dictation: false,
            controller: false
        });
    }

    get vm(): IReportBugViewModel {
        return {
            open: this.isOpen,
            description: this.description,
            listening: this.listening,
            dictationSupported: this.dictation.supported,
            screenshots: this.screenshots,
            recordedEventCount: this.events.length,
            busy: this.status !== null,
            statusLabel: this.status,
            error: this.error,
            outcome: this.outcome,
            // A screenshot on its own is a report: the error text is often in the image.
            canSubmit: this.status === null && !this.isEmpty()
        };
    }

    open(): void {
        this.reset();
        this.isOpen = true;
    }

    close(): void {
        this.stopDictation();
        this.abort();
        this.isOpen = false;
    }

    describe(description: string): void {
        this.description = description;
    }

    toggleDictation(): void {
        if (this.listening) {
            this.stopDictation();
            return;
        }

        this.listening = true;
        this.dictation.start(
            text => this.appendDictated(text),
            () => this.markNotListening()
        );
    }

    attachScreenshot(dataUrl: string): void {
        this.screenshots = [...this.screenshots, dataUrl];
    }

    removeScreenshot(index: number): void {
        this.screenshots = this.screenshots.filter((_, position) => position !== index);
    }

    async submit(): Promise<void> {
        if (!this.environment) {
            return;
        }

        this.stopDictation();
        this.beginSubmission();

        const screenshots: IReportedScreenshot[] = [];
        for (const dataUrl of this.screenshots) {
            const screenshot = parseDataUrl(dataUrl);
            if (screenshot) {
                screenshots.push(screenshot);
            }
        }

        const controller = new AbortController();
        this.controller = controller;

        const payload = {
            description: this.description.trim(),
            reportedAt: this.capturedAt,
            events: this.events,
            environment: this.environment,
            screenshots
        };

        try {
            for await (const event of this.gateway.execute(payload, controller.signal)) {
                this.apply(event);
            }
        } catch (error) {
            // A close() mid-flight aborts the read, which is not something to report back.
            if (!controller.signal.aborted) {
                this.markFailed(describeFailure(error));
            }
        }

        this.controller = null;
    }

    /*
     * Each event either updates what the dialog says it is doing, or ends the run. A stream that
     * stops without a terminal event leaves `status` set, so the dialog stays busy rather than
     * silently looking finished.
     */
    private apply(event: SubmitBugReportGateway.Event): void {
        if (event.type === "drafting") {
            this.setStatus("Writing up the report...");
            return;
        }
        if (event.type === "uploading") {
            this.setStatus(`Uploading screenshot ${event.index} of ${event.total}...`);
            return;
        }
        if (event.type === "creating") {
            this.setStatus("Creating the issue...");
            return;
        }
        if (event.type === "error") {
            this.markFailed(event.message);
            return;
        }

        this.markDone(event.type, event.url);
    }

    private setStatus(status: string): void {
        this.status = status;
    }

    private abort(): void {
        if (!this.controller) {
            return;
        }
        this.controller.abort();
        this.controller = null;
    }

    private reset(): void {
        this.description = "";
        this.screenshots = [];
        this.error = null;
        this.outcome = null;
        this.status = null;
        this.capturedAt = Date.now();
        this.events = this.recorder.getEvents();
        this.environment = collectEnvironment();
    }

    private isEmpty(): boolean {
        if (this.description.trim() !== "") {
            return false;
        }
        return this.screenshots.length === 0;
    }

    private beginSubmission(): void {
        this.error = null;
        // Deliberately vague: which ending we get is the API's call, not known until it answers.
        this.status = "Writing up the report...";
    }

    private markDone(mode: "filed" | "compose", url: string): void {
        this.status = null;
        this.outcome = {
            mode,
            url,
            remindToPasteScreenshot: mode === "compose" && this.screenshots.length > 0
        };
    }

    private markFailed(message: string): void {
        this.status = null;
        this.error = message;
    }

    private appendDictated(text: string): void {
        if (this.description === "") {
            this.description = text;
            return;
        }
        this.description = `${this.description} ${text}`;
    }

    private markNotListening(): void {
        this.listening = false;
    }

    private stopDictation(): void {
        this.dictation.stop();
        this.listening = false;
    }
}

export const ReportBugPresenter = Abstraction.createImplementation({
    implementation: ReportBugPresenterImpl,
    dependencies: [ActionRecorder, SubmitBugReportGateway, SpeechDictation]
});
