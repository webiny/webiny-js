import chalk from "chalk";
import { type UiService } from "@webiny/cli-core/abstractions/index.js";
import { printWatchReady } from "./watchBanner.js";

/**
 * Collects what each watched app reports while starting, and prints one summary of where everything
 * ended up. With api and admin sharing a single `webiny watch` process, their startup lines are buried
 * in interleaved build output, so the summary is the one place that answers "what is running where".
 *
 * Two signals per app, because they don't arrive together. The URL comes early — the admin dev server
 * binds its port and announces it well before the first build lands — while "done starting" comes later.
 * Both are sniffed from the child processes rather than predicted: neither port is settled up front
 * (the api auto-advances from 3002 if it's taken, the admin dev server does the same from 3001), and
 * build times obviously aren't knowable either.
 *
 * This is a collector, not a scheduler. It reports state changes through `onChange` and leaves the
 * caller to decide when to act on them.
 */
export class WatchSummary {
    private readonly expected: string[] = [];
    private readonly urls = new Map<string, string>();
    private readonly ready = new Set<string>();
    private printed = false;

    constructor(
        private ui: UiService.Interface,
        private startedAt: number,
        private onChange: () => void = () => undefined
    ) {}

    expect(app: string) {
        if (!this.expected.includes(app)) {
            this.expected.push(app);
        }
    }

    /**
     * Records the first URL an app reports. Later ones are ignored — a dev server can announce several
     * (rsbuild prints a `Network:` URL right after the `Local:` one), and a restart re-announces.
     */
    reportUrl(app: string, url: string) {
        if (!this.expected.includes(app) || this.urls.has(app)) {
            return;
        }

        // The two sources disagree on trailing slashes (rsbuild prints one, the api runner doesn't) —
        // normalize so the summary doesn't look sloppy.
        this.urls.set(app, url.replace(/\/+$/, ""));
        this.onChange();
    }

    /** Records that an app finished starting: its server is listening, or its first build landed. */
    reportReady(app: string) {
        if (!this.expected.includes(app) || this.ready.has(app)) {
            return;
        }

        this.ready.add(app);
        this.onChange();
    }

    /** Every app has said where it is. Enough to print, but not necessarily done booting. */
    get hasAllUrls() {
        return this.urls.size === this.expected.length;
    }

    /** Every app has said where it is *and* that it finished starting. */
    get isSettled() {
        return this.hasAllUrls && this.ready.size === this.expected.length;
    }

    print() {
        if (this.printed || !this.hasAllUrls) {
            return;
        }

        this.printed = true;

        printWatchReady(this.ui, {
            elapsedMs: Date.now() - this.startedAt,
            entries: this.expected.map(app => ({
                label: app,
                value: chalk.cyan(this.urls.get(app))
            }))
        });
    }
}
