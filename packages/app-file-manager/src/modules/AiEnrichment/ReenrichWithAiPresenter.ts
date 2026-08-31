import { makeAutoObservable } from "mobx";
import { FileDetailsPresenter } from "~/presentation/FileDetails/abstractions.js";
import {
    ReenrichFileGateway,
    ReenrichWithAiPresenter as PresenterAbstraction
} from "./abstractions.js";
import type {
    IReenrichFileGateway,
    IReenrichWithAiPresenter,
    IReenrichWithAiViewModel
} from "./abstractions.js";

type Status = "idle" | "running" | "ready" | "error";

const STATUS_LABEL: Record<Status, string> = {
    idle: "",
    running: "Analyzing image…",
    ready: "Review the suggestion, then save.",
    error: "Failed."
};

class ReenrichWithAiPresenterImpl implements IReenrichWithAiPresenter {
    private open = false;
    private status: Status = "idle";
    private tags: string[] = [];
    private description = "";
    private error: string | null = null;

    /**
     * Not observable state — nothing renders from it. It exists so an in-flight stream can be
     * abandoned when the dialog closes or the view goes away; a streaming response stays open for as
     * long as the producer runs, so without this the read loop would outlive its reader.
     */
    private controller: AbortController | null = null;

    constructor(
        private gateway: IReenrichFileGateway,
        private fileDetails: FileDetailsPresenter.Interface
    ) {
        // The second type parameter is what lets a PRIVATE field appear in the annotation map.
        makeAutoObservable<ReenrichWithAiPresenterImpl, "controller">(this, { controller: false });
    }

    get vm(): IReenrichWithAiViewModel {
        return {
            open: this.open,
            message: this.error ?? STATUS_LABEL[this.status],
            tags: this.tags,
            description: this.description,
            canSave: this.status === "ready",
            loading: this.status === "running"
        };
    }

    async start(fileId: string) {
        const controller = this.beginRun();

        try {
            for await (const event of this.gateway.execute(fileId, {
                signal: controller.signal
            })) {
                if (event.type === "partial" || event.type === "done") {
                    this.applyOutput(event.tags, event.description, event.type === "done");
                }

                // Nothing is written yet — the route only proposes. The user accepts with save().
                if (event.type === "done") {
                    this.finish("ready");
                }

                if (event.type === "error") {
                    this.fail(event.message);
                }
            }
        } catch (err) {
            // An abort is this presenter's own doing, not a failure to report.
            if (err instanceof DOMException && err.name === "AbortError") {
                return;
            }
            this.fail(err instanceof Error ? err.message : String(err));
        }
    }

    accept() {
        if (this.status !== "ready") {
            return;
        }

        this.fileDetails.applyEnrichment({ tags: this.tags, description: this.description });
        this.setOpen(false);
    }

    setOpen(open: boolean) {
        if (!open) {
            this.abort();
        }
        this.open = open;
    }

    /**
     * Called when the view unmounts. Resets, not just aborts: the presenter is a DI singleton, so a
     * left-over `open` would pop the dialog straight back up the next time the view mounts.
     */
    dispose() {
        this.abort();
        this.open = false;
        this.status = "idle";
        this.tags = [];
        this.description = "";
        this.error = null;
    }

    /** Aborts any previous run, clears the last result, and opens the dialog on a fresh one. */
    private beginRun(): AbortController {
        this.abort();

        const controller = new AbortController();
        this.controller = controller;

        this.open = true;
        this.status = "running";
        this.tags = [];
        this.description = "";
        this.error = null;

        return controller;
    }

    /**
     * Merges one streamed value into the displayed proposal.
     *
     * The model streams the tag array CHARACTER by character, so the last entry of a partial value is
     * usually a half-written word — "webiny" arrives as "web", "webi", "webiny". While the stream is
     * running that trailing entry is dropped, so a chip appears only once its text is settled; the
     * `done` value is complete and used whole.
     *
     * Do NOT accumulate across partials instead of replacing. Every prefix differs from the last, so
     * "keep everything seen" turns one tag into a chip per keystroke.
     */
    private applyOutput(tags: string[], description: string, final: boolean) {
        this.tags = final ? tags : tags.slice(0, -1);
        this.description = description;
    }

    private finish(status: Status) {
        this.status = status;
    }

    private fail(message: string) {
        this.error = message;
        this.status = "error";
    }

    private abort() {
        this.controller?.abort();
        this.controller = null;
    }
}

export const ReenrichWithAiPresenter = PresenterAbstraction.createImplementation({
    implementation: ReenrichWithAiPresenterImpl,
    dependencies: [ReenrichFileGateway, FileDetailsPresenter]
});
