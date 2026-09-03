import { Writable } from "node:stream";
import { type StdioService, type UiService } from "@webiny/cli-core/abstractions/index.js";
import { stripAnsi } from "./terminalPrefix.js";

/**
 * Lines that make a source worth replaying once the gate opens. Deliberately broad: a false positive
 * costs a few extra lines on screen, a miss swallows a build warning the developer needed to see.
 */
const PROBLEM = /\b(warn|warning|error|failed|failure|deprecated)\b/i;

/**
 * Above this many buffered lines, give up on holding output back and switch to live. A startup this
 * noisy is worth watching as it happens, and it keeps the buffer from growing without bound.
 */
const MAX_BUFFERED_LINES = 5000;

type Target = "stdout" | "stderr";

interface IBufferedLine {
    source: string;
    target: Target;
    line: string;
}

/**
 * Holds child process output back while the apps boot, so the startup burst (every package announcing
 * its first build, the api waiting for that build to land, rsbuild's banner) doesn't bury the summary
 * of what came up where.
 *
 * Nothing is dropped silently. When the gate opens, every source that printed something looking like a
 * warning or an error is replayed from that line on — the rest of the source, not just the matching
 * line, so multi-line compiler diagnostics stay intact and in order. Anything that goes wrong before
 * the apps are up (a process exiting, the wait timing out, too much output to hold) opens the gate and
 * replays everything.
 */
export class WatchOutputGate {
    private readonly buffered: IBufferedLine[] = [];

    /** Source -> index into `buffered` of the first line that looked like a problem. */
    private readonly problemSources = new Map<string, number>();
    private opened: boolean;

    /**
     * `onActivity` fires for every line buffered while the gate is closed, so the caller can tell a
     * still-booting app from a finished one and wait for the output to go quiet before opening.
     */
    constructor(
        private stdio: StdioService.Interface,
        private ui: UiService.Interface,
        private options: { open?: boolean; onActivity?: () => void } = {}
    ) {
        this.opened = options.open ?? false;
    }

    /**
     * A writable to pipe one labelled child stream into. `source` groups lines that belong together
     * (a package's build output, a server's log) so they can be replayed as a unit.
     */
    sink(source: string, target: Target) {
        return new Writable({
            write: (chunk, _encoding, callback) => {
                this.accept(source, target, chunk.toString());
                callback();
            }
        });
    }

    /**
     * Start writing output through. Replays the sources that reported a problem — or, with
     * `replayAll`, the entire buffer, for when the apps never reached a known-good state.
     */
    open(options: { replayAll?: boolean } = {}) {
        if (this.opened) {
            return;
        }

        this.opened = true;

        const replay = this.buffered.filter(({ source }, index) => {
            if (options.replayAll) {
                return true;
            }

            const from = this.problemSources.get(source);
            return from !== undefined && index >= from;
        });

        this.buffered.length = 0;

        if (replay.length === 0) {
            return;
        }

        this.ui.warning("Reported while starting up:");
        for (const { target, line } of replay) {
            this.stream(target).write(`${line}\n`);
        }
        // Keeps the replayed block from running straight into whatever the caller prints next.
        this.ui.text("");
    }

    private accept(source: string, target: Target, text: string) {
        if (this.opened) {
            this.stream(target).write(text);
            return;
        }

        // The prefixers upstream emit whole lines, but a readable side is free to coalesce them into
        // one chunk — so split again rather than assuming one chunk is one line.
        for (const line of text.split(/\r?\n/)) {
            if (!line.trim()) {
                continue;
            }

            if (!this.problemSources.has(source) && PROBLEM.test(stripAnsi(line))) {
                this.problemSources.set(source, this.buffered.length);
            }

            this.buffered.push({ source, target, line });
        }

        if (this.buffered.length > MAX_BUFFERED_LINES) {
            this.open({ replayAll: true });
            return;
        }

        this.options.onActivity?.();
    }

    private stream(target: Target) {
        return target === "stdout" ? this.stdio.getStdout() : this.stdio.getStderr();
    }
}
