import { makeAutoObservable } from "mobx";
import { ActionRecorder } from "../../recording/abstractions.js";
import type { IRecordedEvent } from "../../recording/abstractions.js";
import { captureScreenshot } from "../../capture/captureScreenshot.js";
import { collectEnvironment } from "../../capture/collectEnvironment.js";
import { SubmitBugReportGateway } from "../../gateway/abstractions.js";
import { SpeechDictation } from "../../speech/abstractions.js";
import { ReportBugPresenter as Abstraction } from "./abstractions.js";
import type { IReportBugViewModel } from "./abstractions.js";
import type { IReportedEnvironment } from "../../shared/types.js";

function waitForRepaint(): Promise<void> {
    return new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
        });
    });
}

function describeFailure(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

/* The API wants bare base64; a canvas data URL carries a `data:image/png;base64,` prefix. */
function readBase64Payload(dataUrl: string): string | null {
    const separator = dataUrl.indexOf(",");
    if (separator === -1) {
        return null;
    }
    return dataUrl.slice(separator + 1);
}

class ReportBugPresenterImpl implements Abstraction.Interface {
    private isOpen = false;
    private description = "";
    private listening = false;
    private screenshot: string | null = null;
    private events: IRecordedEvent[] = [];
    private environment: IReportedEnvironment | null = null;
    private capturedAt = 0;
    private status: string | null = null;
    private error: string | null = null;
    private issueUrl: string | null = null;

    constructor(
        private recorder: ActionRecorder.Interface,
        private gateway: SubmitBugReportGateway.Interface,
        private dictation: SpeechDictation.Interface
    ) {
        makeAutoObservable<ReportBugPresenterImpl, "recorder" | "gateway" | "dictation">(this, {
            recorder: false,
            gateway: false,
            dictation: false
        });
    }

    get vm(): IReportBugViewModel {
        return {
            open: this.isOpen,
            description: this.description,
            listening: this.listening,
            dictationSupported: this.dictation.supported,
            screenshot: this.screenshot,
            recordedEventCount: this.events.length,
            busy: this.status !== null,
            statusLabel: this.status,
            error: this.error,
            issueUrl: this.issueUrl,
            canSubmit: this.status === null && this.description.trim() !== ""
        };
    }

    /*
     * The palette closes before this runs, and the two repainted frames let it disappear —
     * otherwise the screenshot is a picture of the palette rather than of the bug. Transient
     * user activation outlives that wait, so the share prompt still opens.
     */
    async open(): Promise<void> {
        this.reset();

        await waitForRepaint();
        const captured = await captureScreenshot();
        this.setScreenshot(captured);

        this.show();
    }

    close(): void {
        this.stopDictation();
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

    async retakeScreenshot(): Promise<void> {
        const captured = await captureScreenshot();
        this.setScreenshot(captured);
    }

    discardScreenshot(): void {
        this.screenshot = null;
    }

    async submit(): Promise<void> {
        if (!this.environment) {
            return;
        }

        this.stopDictation();
        this.beginSubmission();

        let screenshotBase64: string | null = null;
        if (this.screenshot) {
            screenshotBase64 = readBase64Payload(this.screenshot);
        }

        try {
            const issue = await this.gateway.execute({
                description: this.description.trim(),
                reportedAt: this.capturedAt,
                events: this.events,
                environment: this.environment,
                screenshotBase64
            });

            this.markFiled(issue.url);
        } catch (error) {
            this.markFailed(describeFailure(error));
        }
    }

    private reset(): void {
        this.description = "";
        this.screenshot = null;
        this.error = null;
        this.issueUrl = null;
        this.status = null;
        this.capturedAt = Date.now();
        this.events = this.recorder.getEvents();
        this.environment = collectEnvironment();
    }

    private show(): void {
        this.isOpen = true;
    }

    private setScreenshot(screenshot: string | null): void {
        this.screenshot = screenshot;
    }

    private beginSubmission(): void {
        this.error = null;
        this.status = "Filing the issue...";
    }

    private markFiled(url: string): void {
        this.status = null;
        this.issueUrl = url;
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
