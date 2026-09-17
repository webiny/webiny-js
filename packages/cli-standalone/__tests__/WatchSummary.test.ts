import { describe, expect, it } from "vitest";
import { type UiService } from "@webiny/cli-core/abstractions/index.js";
import { WatchSummary } from "~/features/WatchSummary.js";

/**
 * Collects what the summary printed, with `%s` placeholders filled in the way UiService does, so the
 * assertions read like the terminal output.
 */
function createUi() {
    const lines: string[] = [];

    const record = (text: string, ...args: any[]) => {
        let index = 0;
        lines.push(text.replace(/%s/g, () => String(args[index++])).replace(/%%/g, "%"));
    };

    const ui = {
        raw: record,
        text: record,
        textBold: record,
        emptyLine: () => lines.push(""),
        info: record,
        success: record,
        error: record,
        warning: record,
        debug: record
    } as UiService.Interface;

    return { ui, lines, output: () => lines.join("\n") };
}

/** A summary for `api` + `admin` that has already reported everything it reports. */
function settled() {
    const { ui, output } = createUi();
    const summary = new WatchSummary(ui, Date.now());

    for (const app of ["api", "admin"]) {
        summary.expect(app);
        summary.reportUrl(app, `http://localhost:4100${app === "api" ? 0 : 1}`);
        summary.reportReady(app);
    }

    return { summary, output };
}

describe("WatchSummary", () => {
    it("names only the proxy URL, so there is no doubt which one to open", () => {
        const { summary, output } = settled();

        summary.setPublicUrl("http://localhost:3001");
        summary.print();

        expect(output()).toContain("Webiny is available at http://localhost:3001");
        // The apps are behind the proxy. Printing their URLs only invites someone to use one.
        expect(output()).not.toContain("41000");
        expect(output()).not.toContain("41001");
    });

    it("lists the apps too when asked, for when something needs debugging", () => {
        const { summary, output } = settled();

        summary.setPublicUrl("http://localhost:3001", { showAppUrls: true });
        summary.print();

        expect(output()).toContain("Webiny is available at http://localhost:3001");
        expect(output()).toContain("API     http://localhost:41000");
        expect(output()).toContain("Admin   http://localhost:41001");
    });

    it("still lists the apps when there is no proxy, since that is all there is", () => {
        const { summary, output } = settled();

        summary.print();

        expect(output()).not.toContain("Webiny is available");
        expect(output()).toContain("API     http://localhost:41000");
        expect(output()).toContain("Admin   http://localhost:41001");
    });

    it("waits for every app before printing anything", () => {
        const { ui, output } = createUi();
        const summary = new WatchSummary(ui, Date.now());

        summary.expect("api");
        summary.expect("admin");
        summary.reportUrl("api", "http://localhost:41000");
        summary.setPublicUrl("http://localhost:3001");

        summary.print();
        expect(output()).toBe("");

        summary.reportUrl("admin", "http://localhost:41001");
        summary.print();
        expect(output()).toContain("Webiny is available at http://localhost:3001");
    });

    it("prints once, however often it is asked", () => {
        const { summary, output } = settled();

        summary.setPublicUrl("http://localhost:3001");
        summary.print();
        summary.print();

        expect(output().match(/Webiny is available/g)).toHaveLength(1);
    });
});
