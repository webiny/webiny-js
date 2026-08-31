import { makeAutoObservable } from "mobx";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
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

interface IEnrichmentValues {
    tags: string[];
    description: string;
}

/**
 * Reads the values the form is showing right now, to roll back to if a background save fails.
 * `getData()` is untyped, so each field is narrowed rather than cast.
 */
function readFormValues(data: Record<string, unknown>): IEnrichmentValues {
    const tags = Array.isArray(data.tags)
        ? data.tags.filter((tag: unknown): tag is string => typeof tag === "string")
        : [];

    return {
        tags,
        description: typeof data.description === "string" ? data.description : ""
    };
}

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
        private fileDetails: FileDetailsPresenter.Interface,
        private notifications: Notifications.Interface
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
            canSave: this.status === "ready"
        };
    }

    async start(fileId: string) {
        const controller = this.beginRun();

        try {
            for await (const event of this.gateway.execute(fileId, {
                signal: controller.signal
            })) {
                if (event.type === "partial" || event.type === "done") {
                    this.applyOutput(event.tags, event.description);
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

    async save() {
        if (this.status !== "ready") {
            return;
        }

        const previous = readFormValues(this.fileDetails.vm.form.getData());
        const accepted = { tags: this.tags, description: this.description };

        // Optimistic: show the values and get out of the way. The user carries on while the write
        // runs. Straight into the drawer's own form and save path, so enrichment persists exactly the
        // way a manual edit does — one write path, one set of permissions and validation.
        this.fileDetails.applyEnrichment(accepted);
        this.setOpen(false);

        if (await this.persist()) {
            return;
        }

        // Failed, so put back what was on screen before rather than leaving the user believing a
        // change was saved. The dialog is gone by now, hence a notification.
        this.fileDetails.applyEnrichment(previous);
        this.notifications.warning({
            title: "Enrichment not saved",
            description:
                "The AI suggestion could not be saved, so the previous values were restored."
        });
    }

    /** False on a rejected save AND on a thrown one — the caller rolls back either way. */
    private async persist(): Promise<boolean> {
        try {
            return await this.fileDetails.saveFile({ showLoader: false });
        } catch {
            return false;
        }
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

    private applyOutput(tags: string[], description: string) {
        this.tags = tags;
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
    dependencies: [ReenrichFileGateway, FileDetailsPresenter, Notifications]
});
