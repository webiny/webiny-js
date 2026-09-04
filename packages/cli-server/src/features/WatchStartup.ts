import { type WatchOutputGate } from "./WatchOutputGate.js";
import { type WatchSummary } from "./WatchSummary.js";

/**
 * How long to hold startup output back before giving up and showing it live. Generous, because the
 * first build compiles every package in the app — a developer staring at a silent terminal is worse
 * than a noisy one.
 */
const STARTUP_TIMEOUT = 180 * 1000;

/**
 * How long the apps have to stay quiet, after they all report being up, before the summary is printed.
 * Reporting "up" and going quiet aren't the same moment: the api logs a little more after it starts
 * listening, and the last package build can land after that. Without this, those stragglers print
 * underneath the summary, which is exactly what the summary exists to avoid.
 */
const QUIET_PERIOD = 750;

/**
 * Fallback for when the apps report their URLs but never say they finished starting — a tool changing
 * the wording of its ready line shouldn't mean output stays buffered until `STARTUP_TIMEOUT`.
 */
const READY_TIMEOUT = 15 * 1000;

/**
 * Decides when the startup phase is over, and releases the gate and the summary when it is.
 *
 * The gate knows what to replay and the summary knows what each app reported, but neither knows *when*
 * to act, and answering that means three interacting timers over shared mutable state. That belongs in
 * one object rather than a handful of closures in the command handler.
 *
 * The command feeds it two events — output was held back, and an app reported something — and one
 * failure signal.
 */
export class WatchStartup {
    private quietTimer: NodeJS.Timeout | undefined;
    private readyTimer: NodeJS.Timeout | undefined;
    private startupTimer: NodeJS.Timeout | undefined;
    private released = false;

    constructor(
        private gate: WatchOutputGate,
        private summary: WatchSummary | undefined
    ) {}

    /** Start waiting. Arms the outer time limit on the whole startup phase. */
    begin() {
        this.startupTimer = setTimeout(() => this.abandon(), STARTUP_TIMEOUT);
        this.startupTimer.unref();
    }

    /** A line was held back. Startup isn't finished while output is still arriving. */
    noteOutput() {
        this.waitForQuiet();
    }

    /** An app reported a URL, or that it finished starting. */
    noteProgress() {
        if (this.released) {
            return;
        }

        if (this.summary?.isSettled) {
            this.waitForQuiet();
            return;
        }

        if (this.summary?.hasAllUrls && !this.readyTimer) {
            this.readyTimer = setTimeout(() => this.release(), READY_TIMEOUT);
            this.readyTimer.unref();
        }
    }

    /**
     * Startup never reached a known-good state — a watcher exited, or the wait ran long. Replay
     * everything so the reason is on screen.
     *
     * Deliberately does not mark the phase released: if the apps do come up after this, the summary is
     * still worth printing. This only stops holding output back.
     */
    abandon() {
        this.clearTimers();
        this.gate.open({ replayAll: true });
    }

    /** Nothing is waiting on these timers any more. */
    dispose() {
        this.clearTimers();
    }

    private waitForQuiet() {
        if (this.released || !this.summary?.isSettled) {
            return;
        }

        clearTimeout(this.quietTimer);
        this.quietTimer = setTimeout(() => this.release(), QUIET_PERIOD);
        this.quietTimer.unref();
    }

    private release() {
        if (this.released) {
            return;
        }

        this.released = true;
        this.clearTimers();

        // Both are idempotent, so the failure paths above can call into them too.
        this.gate.open();
        this.summary?.print();
    }

    private clearTimers() {
        clearTimeout(this.quietTimer);
        clearTimeout(this.readyTimer);
        clearTimeout(this.startupTimer);
    }
}
