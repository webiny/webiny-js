import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as d from "../lib.ts";
import { makeRaw, makeRepo, runCli, writeListing } from "./helpers.ts";

describe("parseWrapper", () => {
    it("decodes to the exact bytes", () => {
        const content = '<a href="x">&amp;copy &copy; é &lt;</a>\n';
        const { attrs, data } = d.parseWrapper(makeRaw("Content Review.dc.html", "e1", content));
        assert.deepEqual(attrs, { path: "Content Review.dc.html", etag: "e1" });
        assert.deepEqual(data, Buffer.from(content, "utf8"));
    });

    it("handles an empty file", () => {
        assert.deepEqual(d.parseWrapper(makeRaw("e.html", "e1", "")).data, Buffer.alloc(0));
    });

    it("fails without a wrapper", () => {
        assert.throws(() => d.parseWrapper("just text"), d.DesignError);
    });
});

describe("import-raw", () => {
    let top = "";
    let folder = "";
    let listing = "";
    let planFile = "";
    let raw = "";

    beforeEach(() => {
        top = makeRepo();
        runCli(top, "init", "d", "--project", "P", "--project-id", "u");
        folder = path.join(top, "d");
        listing = path.join(top, "listing.json");
        planFile = path.join(top, "plan.json");
        raw = path.join(top, "raw.txt");
    });
    afterEach(() => {
        fs.rmSync(top, { recursive: true, force: true });
    });

    const makePlan = (entries: Array<[string, number, string]>) => {
        writeListing(listing, entries);
        const result = runCli(top, "plan", folder, listing, "--out", planFile);
        assert.equal(result.status, 0, result.stderr);
    };
    const importRaw = (...extra: string[]): [number | null, any] => {
        const result = runCli(top, "import-raw", folder, raw, "--plan", planFile, ...extra);
        return [result.status, result.stdout ? JSON.parse(result.stdout) : null];
    };
    const readPlan = () => JSON.parse(fs.readFileSync(planFile, "utf8"));

    it("imports the file and updates the row", () => {
        const content = "<p>a & b</p>\n";
        makePlan([["Content Review.dc.html", Buffer.byteLength(content), "e1"]]);
        fs.writeFileSync(raw, makeRaw("Content Review.dc.html", "e1", content));
        const [code, out] = importRaw();
        assert.deepEqual([code, out.status], [0, "imported"]);
        assert.equal(
            fs.readFileSync(path.join(folder, "files/Content Review.dc.html"), "utf8"),
            content
        );
        assert.equal(d.loadCatalogue(folder).rows["Content Review.dc.html"].etagPulled, "e1");
        assert.deepEqual(readPlan().imported, ["Content Review.dc.html"]);
    });

    it("asks for a retry on a re-typed size mismatch, then fails", () => {
        makePlan([["a.html", 99, "e1"]]);
        fs.writeFileSync(raw, makeRaw("a.html", "e1", "short"));
        let [code, out] = importRaw("--retyped");
        assert.deepEqual([code, out.status], [2, "size_mismatch"]);
        assert.deepEqual(readPlan().failed, []);
        [code, out] = importRaw("--retyped", "--retry");
        assert.deepEqual([code, out.status], [5, "failed"]);
        assert.deepEqual(readPlan().failed, ["a.html"]);
        assert.equal(d.loadCatalogue(folder).rows["a.html"], undefined);
        assert.equal(fs.existsSync(path.join(folder, "files/a.html")), false);
    });

    it("fails a saved result with a size mismatch immediately", () => {
        makePlan([["a.html", 99, "e1"]]);
        fs.writeFileSync(raw, makeRaw("a.html", "e1", "short"));
        const [code, out] = importRaw();
        assert.deepEqual([code, out.status], [5, "failed"]);
    });

    it("reports an unknown etag, then accepts the parent listing", () => {
        makePlan([["x/a.html", 1, "e1"]]);
        fs.writeFileSync(raw, makeRaw("x/a.html", "e2", "ab"));
        let [code, out] = importRaw();
        assert.deepEqual([code, out.status], [3, "etag_unknown"]);
        const parent = path.join(top, "parent.json");
        writeListing(parent, [["x/a.html", 2, "e2"]]);
        [code, out] = importRaw("--listing", parent);
        assert.deepEqual([code, out.status], [0, "imported"]);
        assert.equal(d.loadCatalogue(folder).rows["x/a.html"].etagPulled, "e2");
    });

    it("fails when the parent listing has yet another etag", () => {
        makePlan([["a.html", 1, "e1"]]);
        fs.writeFileSync(raw, makeRaw("a.html", "e2", "ab"));
        const parent = path.join(top, "parent.json");
        writeListing(parent, [["a.html", 2, "e3"]]);
        const [code, out] = importRaw("--listing", parent);
        assert.deepEqual([code, out.status], [5, "failed"]);
    });

    it("sends a re-typed file over the limit to manual export", () => {
        const content = "x".repeat(d.MCP_MAX_FILE + 1);
        makePlan([["a.html", content.length, "e1"]]);
        fs.writeFileSync(raw, makeRaw("a.html", "e1", content));
        const [code, out] = importRaw("--retyped");
        assert.deepEqual([code, out.status], [4, "manual"]);
    });

    it("writes answers.md next to the catalogue", () => {
        const content = "## Q1\nYes.\n";
        makePlan([["answers.md", content.length, "a1"]]);
        fs.writeFileSync(raw, makeRaw("answers.md", "a1", content));
        const [code, out] = importRaw("--answers");
        assert.deepEqual([code, out.status], [0, "imported"]);
        assert.equal(fs.readFileSync(path.join(folder, "answers.md"), "utf8"), content);
        const cat = d.loadCatalogue(folder);
        assert.equal(cat.answersEtag, "a1");
        assert.equal(cat.rows["answers.md"], undefined);
    });

    it("clears removed_at for a reappearing file and keeps its implementation", () => {
        makePlan([["a.html", 2, "e1"]]);
        const cat = d.loadCatalogue(folder);
        cat.rows["a.html"] = d.createRow("a.html", {
            etagPulled: "e0",
            removedAt: "2026-10-07T00:00:00Z",
            etagImplemented: "e0"
        });
        d.saveCatalogue(folder, cat);
        fs.writeFileSync(raw, makeRaw("a.html", "e1", "ab"));
        const [code] = importRaw();
        assert.equal(code, 0);
        const row = d.loadCatalogue(folder).rows["a.html"];
        assert.deepEqual([row.removedAt, row.etagImplemented], ["", "e0"]);
    });
});
