import { makeAutoObservable } from "mobx";
import type { IReenrichFileGateway } from "./abstractions.js";

type Status = "idle" | "running" | "done" | "error";

const STATUS_LABEL: Record<Status, string> = {
    idle: "",
    running: "Analyzing image…",
    done: "Saved.",
    error: "Failed."
};

export interface IReenrichWithAiViewModel {
    open: boolean;
    /** What the dialog says under its title: the error when there is one, else the status. */
    message: string;
    tags: string[];
    description: string;
}

export interface IReenrichWithAiPresenter {
    start(fileId: string): Promise<void>;
    setOpen(open: boolean): void;
    dispose(): void;
    get vm(): IReenrichWithAiViewModel;
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

    constructor(private gateway: IReenrichFileGateway) {
        // The second type parameter is what lets a PRIVATE field appear in the annotation map.
        makeAutoObservable<ReenrichWithAiPresenterImpl, "controller">(this, { controller: false });
    }

    get vm(): IReenrichWithAiViewModel {
        return {
            open: this.open,
            message: this.error ?? STATUS_LABEL[this.status],
            tags: this.tags,
            description: this.description
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

                if (event.type === "done") {
                    this.finish("done");
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

    setOpen(open: boolean) {
        if (!open) {
            this.abort();
        }
        this.open = open;
    }

    dispose() {
        this.abort();
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

export function createReenrichWithAiPresenter(
    gateway: IReenrichFileGateway
): IReenrichWithAiPresenter {
    return new ReenrichWithAiPresenterImpl(gateway);
}
