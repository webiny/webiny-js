import { type UiService } from "@webiny/cli-core/abstractions/index.js";

/** App names a plain capitalize would get wrong. */
const ACRONYMS: Record<string, string> = { api: "API" };

const displayName = (app: string) => ACRONYMS[app] ?? app.charAt(0).toUpperCase() + app.slice(1);

/**
 * `UiService` colorizes `%s` placeholders, which is the wrong emphasis for a table of values — the
 * whole row ends up one colour. Passing the row as a literal keeps the text in the terminal's default
 * colour and leaves only the `┃` rail coloured, so escape any `%` the row happens to contain.
 */
const literal = (text: string) => text.replace(/%/g, "%%");

/**
 * Collects what each watched app reports while starting, and prints one summary of where everything
 * ended up. With api and admin sharing a single `webiny watch` process, their startup lines are buried
 * in interleaved build output, so the summary is the one place that answers "what is running where".
 *
 * Two signals per app, because they don't arrive together. The URL comes early (the admin dev server
 * binds its port and announces it well before the first build lands) while "done starting" comes later.
 * Both are sniffed from the child processes rather than predicted, because build times aren't knowable
 * and, without the proxy, neither port is settled up front either: the api auto-advances from 3002 if
 * it's taken, and the admin dev server does the same from 3001.
 *
 * When the proxy is running there is exactly one URL to open, so that's all the summary says. The
 * per-app URLs are still collected (they're how the summary knows the apps came up) but printing them
 * only invites someone to use one, which is the confusion the proxy exists to remove. `--verbose`
 * shows them for when something needs debugging.
 *
 * This is a collector, not a scheduler. It reports state changes through `onChange` and leaves the
 * caller to decide when to act on them.
 */
export class WatchSummary {
    private readonly expected: string[] = [];
    private readonly urls = new Map<string, string>();
    private readonly ready = new Set<string>();
    private publicUrl: string | undefined;
    private showAppUrls = true;
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
     * The single URL the proxy serves everything on. Known up front rather than sniffed, because the
     * proxy binds its port before any app starts. Takes over the summary: from here on the per-app
     * URLs are printed only when asked for.
     */
    setPublicUrl(url: string, options: { showAppUrls?: boolean } = {}) {
        this.publicUrl = url;
        this.showAppUrls = options.showAppUrls ?? false;
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

        this.ui.emptyLine();
        this.ui.success(`Ready in %s`, this.elapsed());

        if (this.publicUrl) {
            this.ui.success(`Webiny is available at %s`, this.publicUrl);
        }

        if (this.showAppUrls) {
            const names = this.expected.map(displayName);
            const width = Math.max(...names.map(name => name.length));
            // Indented when there's a public URL above them, so it stays clear which one to open.
            const indent = this.publicUrl ? "  " : "";

            this.expected.forEach((app, index) => {
                this.ui.success(
                    literal(`${indent}${names[index].padEnd(width)}   ${this.urls.get(app)}`)
                );
            });
        }

        this.ui.emptyLine();
    }

    /** Sub-second startups read better in milliseconds; anything longer in seconds. */
    private elapsed() {
        const ms = Date.now() - this.startedAt;
        return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
    }
}
