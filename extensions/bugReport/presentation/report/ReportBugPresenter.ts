import { makeAutoObservable } from "mobx";
import { ActionRecorder } from "../../recording/abstractions.js";
import type { IRecordedEvent } from "../../recording/abstractions.js";
import { formatTimeline } from "../../recording/formatTimeline.js";
import { captureScreenshot } from "../../capture/captureScreenshot.js";
import { collectEnvironment } from "../../capture/collectEnvironment.js";
import type { IEnvironmentInfo } from "../../capture/collectEnvironment.js";
import { BugReportSettings } from "../../settings/abstractions.js";
import { GitHubGateway } from "../../github/abstractions.js";
import { IssueDrafter } from "../../ai/abstractions.js";
import { SpeechDictation } from "../../speech/abstractions.js";
import { composeIssueBody } from "../../issue/composeIssueBody.js";
import { BugReportSettingsPresenter } from "../settings/abstractions.js";
import { ReportBugPresenter as Abstraction } from "./abstractions.js";
import type { IReportBugViewModel } from "./abstractions.js";

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

class ReportBugPresenterImpl implements Abstraction.Interface {
    private isOpen = false;
    private description = "";
    private listening = false;
    private screenshot: string | null = null;
    private events: IRecordedEvent[] = [];
    private environment: IEnvironmentInfo | null = null;
    private capturedAt = 0;
    private status: string | null = null;
    private error: string | null = null;
    private issueUrl: string | null = null;

    constructor(
        private recorder: ActionRecorder.Interface,
        private settings: BugReportSettings.Interface,
        private github: GitHubGateway.Interface,
        private drafter: IssueDrafter.Interface,
        private dictation: SpeechDictation.Interface,
        private settingsPresenter: BugReportSettingsPresenter.Interface
    ) {
        makeAutoObservable<
            ReportBugPresenterImpl,
            "recorder" | "settings" | "github" | "drafter" | "dictation" | "settingsPresenter"
        >(this, {
            recorder: false,
            settings: false,
            github: false,
            drafter: false,
            dictation: false,
            settingsPresenter: false
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
        if (!this.settings.isConfigured) {
            this.settingsPresenter.open();
            return;
        }

        this.reset();

        if (this.settings.values.includeScreenshot) {
            await waitForRepaint();
            const captured = await captureScreenshot();
            this.setScreenshot(captured);
        }

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

        try {
            const timeline = formatTimeline(this.events, this.capturedAt);
            const draft = await this.drafter.draft({
                description: this.description.trim(),
                environment: this.environment,
                timeline,
                labels: this.settings.labelList
            });

            let screenshotUrl: string | null = null;
            if (this.screenshot) {
                this.setStatus("Uploading the screenshot...");
                screenshotUrl = await this.github.uploadScreenshot(this.screenshot);
            }

            this.setStatus("Creating the issue...");
            const body = composeIssueBody({
                draft,
                description: this.description.trim(),
                environment: this.environment,
                timeline,
                screenshotUrl
            });

            const issue = await this.github.createIssue({
                title: draft.title,
                body,
                labels: draft.labels
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
        this.status = "Drafting the issue...";
    }

    private setStatus(status: string): void {
        this.status = status;
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
    dependencies: [
        ActionRecorder,
        BugReportSettings,
        GitHubGateway,
        IssueDrafter,
        SpeechDictation,
        BugReportSettingsPresenter
    ]
});
