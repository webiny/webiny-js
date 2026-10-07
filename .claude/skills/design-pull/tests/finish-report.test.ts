import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as d from "../lib.ts";
import { makeRepo, runCli, writeListing } from "./helpers.ts";

describe("finish and report", () => {
    let top = "";
    let folder = "";
    let files = "";
    let listing = "";
    let planFile = "";

    beforeEach(() => {
        top = makeRepo();
        runCli(top, "init", "d", "--project", "P", "--project-id", "u", "--question-prefix", "T");
        folder = path.join(top, "d");
        files = path.join(folder, "files");
        fs.mkdirSync(files);
        listing = path.join(top, "listing.json");
        planFile = path.join(top, "plan.json");
    });
    afterEach(() => {
        fs.rmSync(top, { recursive: true, force: true });
    });

    const runOk = (...args: string[]): string => {
        const result = runCli(top, ...args);
        assert.equal(result.status, 0, result.stderr);
        return result.stdout;
    };
    const writeIn = (dir: string, rel: string, content: string) => {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, rel), content);
    };

    it("records removals, reconciles identical content and reports", () => {
        writeIn(files, "Content Review.dc.html", "v2");
        writeIn(files, "gone.html", "g");
        writeIn(files, "Picker.dc.html", "p2");
        const cat = d.loadCatalogue(folder);
        cat.rows["Content Review.dc.html"] = d.createRow("Content Review.dc.html", {
            etagPulled: "e2",
            etagImplemented: "e1"
        });
        cat.rows["gone.html"] = d.createRow("gone.html", {
            etagPulled: "g1",
            etagImplemented: "g1"
        });
        cat.rows["Picker.dc.html"] = d.createRow("Picker.dc.html", {
            etagPulled: "p2",
            etagImplemented: "p1"
        });
        d.saveCatalogue(folder, cat);
        const implemented = path.join(folder, ".implemented");
        writeIn(implemented, "Content Review.dc.html", "v2");
        writeIn(implemented, "gone.html", "g");
        writeIn(implemented, "Picker.dc.html", "p1");
        writeListing(listing, [
            ["Content Review.dc.html", 2, "e2"],
            ["Picker.dc.html", 2, "p2"]
        ]);
        runOk("plan", folder, listing, "--out", planFile);
        runOk("finish", folder, "--plan", planFile);

        const after = d.loadCatalogue(folder);
        assert.equal(after.rows["Content Review.dc.html"].etagImplemented, "e2");
        assert.ok(after.rows["gone.html"].removedAt);
        assert.equal(fs.existsSync(path.join(files, "gone.html")), false);
        assert.equal(fs.readFileSync(path.join(folder, ".removed/gone.html"), "utf8"), "g");
        assert.ok(fs.existsSync(path.join(implemented, "gone.html")));
        assert.equal(after.lastPull, JSON.parse(fs.readFileSync(planFile, "utf8")).listed_at);

        const report = runOk("report", folder, "--plan", planFile);
        assert.ok(report.includes("Removed:\n  - gone.html"), report);
        assert.ok(
            report.includes("Etag changed, content identical:\n  - Content Review.dc.html"),
            report
        );
        assert.ok(report.includes("diff .implemented/Picker.dc.html files/Picker.dc.html"), report);
    });

    it("quotes paths with spaces and lists answers", () => {
        const cat = d.loadCatalogue(folder);
        cat.rows["A B.html"] = d.createRow("A B.html", { etagPulled: "2", etagImplemented: "1" });
        d.saveCatalogue(folder, cat);
        writeListing(listing, [["A B.html", 0, "2"]]);
        writeIn(files, "A B.html", "");
        runOk("plan", folder, listing, "--out", planFile);
        const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));
        plan.answers_result = { answered: ["BZ-3"], changed: ["BZ-4"], unknown: ["BZ-9"] };
        fs.writeFileSync(planFile, JSON.stringify(plan));
        const report = runOk("report", folder, "--plan", planFile);
        assert.ok(report.includes("diff '.implemented/A B.html' 'files/A B.html'"), report);
        assert.ok(report.includes("Newly answered:\n  - QBZ-3"), report);
        assert.ok(report.includes("Answer changed:\n  - QBZ-4"), report);
        assert.ok(report.includes("Answers without a logged question:\n  - QBZ-9"), report);
    });

    it("says nothing changed", () => {
        writeIn(files, "a.html", "a");
        writeListing(listing, [["a.html", 1, "e1"]]);
        runOk("plan", folder, listing, "--out", planFile);
        runOk("finish", folder, "--plan", planFile);
        fs.rmSync(planFile);
        runOk("plan", folder, listing, "--out", planFile);
        runOk("finish", folder, "--plan", planFile);
        assert.equal(runOk("report", folder, "--plan", planFile).trim(), "Nothing changed.");
    });

    it("separates new and changed files", () => {
        writeIn(files, "old.html", "o2");
        writeIn(files, "fresh.html", "f");
        const cat = d.loadCatalogue(folder);
        cat.rows["old.html"] = d.createRow("old.html", {
            etagPulled: "o1",
            pulledAt: "2000-01-01T00:00:00Z"
        });
        d.saveCatalogue(folder, cat);
        writeListing(listing, [
            ["old.html", 2, "o2"],
            ["fresh.html", 1, "f1"]
        ]);
        runOk("plan", folder, listing, "--out", planFile);
        const report = runOk("report", folder, "--plan", planFile);
        assert.ok(report.includes("New:\n  - fresh.html"), report);
        assert.ok(report.includes("Changed:\n  - old.html"), report);
    });

    it("lists files that were planned for download but never fetched", () => {
        writeListing(listing, [
            ["a.html", 3, "e1"],
            ["b.html", 3, "e2"]
        ]);
        runOk("plan", folder, listing, "--out", planFile);
        const report = runOk("report", folder, "--plan", planFile);
        assert.ok(report.includes("Not fetched:\n  - a.html\n  - b.html"), report);
    });
});

describe("shellQuote", () => {
    it("quotes only when needed", () => {
        assert.equal(d.shellQuote("files/a.html"), "files/a.html");
        assert.equal(d.shellQuote("files/A B.html"), "'files/A B.html'");
        assert.equal(d.shellQuote("it's"), "'it'\"'\"'s'");
        assert.equal(d.shellQuote(""), "''");
    });
});
