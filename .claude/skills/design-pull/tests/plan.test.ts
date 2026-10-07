import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as d from "../lib.ts";
import { makeRepo, runCli, writeListing } from "./helpers.ts";

describe("plan", () => {
    let top = "";
    let folder = "";
    let files = "";
    let listing = "";
    let out = "";

    beforeEach(() => {
        top = makeRepo();
        runCli(top, "init", "d", "--project", "P", "--project-id", "u");
        folder = path.join(top, "d");
        files = path.join(folder, "files");
        fs.mkdirSync(files);
        listing = path.join(top, "listing.json");
        out = path.join(top, "plan.json");
    });
    afterEach(() => {
        fs.rmSync(top, { recursive: true, force: true });
    });

    const plan = () => {
        const result = runCli(top, "plan", folder, listing, "--out", out);
        assert.equal(result.status, 0, result.stderr);
        return JSON.parse(fs.readFileSync(out, "utf8"));
    };
    const write = (rel: string, content: string) => {
        fs.mkdirSync(path.dirname(path.join(files, rel)), { recursive: true });
        fs.writeFileSync(path.join(files, rel), content);
    };

    it("adopts unzipped files with a matching size", () => {
        write("Content Review.dc.html", "abcd");
        write("_ds/kit.css", "xy");
        write("README.md", "handoff note");
        writeListing(listing, [
            ["Content Review.dc.html", 4, "e1"],
            ["_ds/kit.css", 3, "e2"],
            ["Picker.dc.html", 10, "e3"],
            ["img.png", 5, "e4"],
            [".thumbnail", 9, "e5"],
            ["design_handoff_w/README.md", 12, "e6"],
            ["answers.md", 20, "e7"]
        ]);
        const result = plan();
        assert.deepEqual(result.adopted, ["Content Review.dc.html"]);
        assert.deepEqual([...result.mcp].sort(), ["Picker.dc.html", "_ds/kit.css"]);
        assert.deepEqual(result.manual, ["img.png"]);
        assert.deepEqual(result.answers, { size: 20, etag: "e7" });
        const cat = d.loadCatalogue(folder);
        const row = cat.rows["Content Review.dc.html"];
        assert.deepEqual([row.etagPulled, row.kind], ["e1", "screen"]);
        assert.equal(cat.rows["README.md"], undefined);
        assert.equal(cat.rows[".thumbnail"], undefined);
        assert.ok(fs.existsSync(path.join(files, "README.md")));
    });

    it("reports nothing changed on a second run", () => {
        write("a.html", "abcd");
        writeListing(listing, [["a.html", 4, "e1"]]);
        plan();
        const before = fs.readFileSync(path.join(folder, "catalogue.md"), "utf8");
        const result = plan();
        assert.deepEqual(result.unchanged, ["a.html"]);
        assert.deepEqual([...result.adopted, ...result.mcp, ...result.manual, ...result.removed], []);
        assert.equal(fs.readFileSync(path.join(folder, "catalogue.md"), "utf8"), before);
    });

    it("does not adopt an old local copy for a newer etag", () => {
        write("a.html", "abcd");
        writeListing(listing, [["a.html", 4, "e1"]]);
        plan();
        const old = new Date(Date.now() - 3600_000);
        fs.utimesSync(path.join(files, "a.html"), old, old);
        writeListing(listing, [["a.html", 4, "e2"]]);
        const result = plan();
        assert.deepEqual(result.adopted, []);
        assert.deepEqual(result.mcp, ["a.html"]);
        assert.equal(d.loadCatalogue(folder).rows["a.html"].etagPulled, "e1");
    });

    it("adopts a newer unzipped copy for a newer etag", () => {
        write("a.html", "abcd");
        writeListing(listing, [["a.html", 4, "e1"]]);
        plan();
        write("a.html", "wxyz");
        const future = new Date(Date.now() + 60_000);
        fs.utimesSync(path.join(files, "a.html"), future, future);
        writeListing(listing, [["a.html", 4, "e2"]]);
        assert.deepEqual(plan().adopted, ["a.html"]);
    });

    it("counts a missing local file as changed", () => {
        write("a.html", "abcd");
        writeListing(listing, [["a.html", 4, "e1"]]);
        plan();
        fs.rmSync(path.join(files, "a.html"));
        assert.deepEqual(plan().mcp, ["a.html"]);
    });

    it("reports removed and excluded files", () => {
        write("a.html", "abcd");
        write("b.html", "ab");
        writeListing(listing, [
            ["a.html", 4, "e1"],
            ["b.html", 2, "e2"]
        ]);
        plan();
        const cat = d.loadCatalogue(folder);
        cat.exclude.push("b.html");
        d.saveCatalogue(folder, cat);
        writeListing(listing, [["b.html", 2, "e2"]]);
        const result = plan();
        assert.deepEqual(result.removed, ["a.html"]);
        assert.deepEqual(result.excluded, ["b.html"]);
    });

    it("rejects unsafe and colliding paths", () => {
        writeListing(listing, [
            ["../x.html", 1, "e1"],
            ["Foo.html", 1, "e2"],
            ["foo.html", 1, "e3"],
            ["ok.html", 1, "e4"]
        ]);
        const result = plan();
        assert.deepEqual([...result.rejected].sort(), ["../x.html", "Foo.html", "foo.html"]);
        assert.deepEqual(result.mcp, ["ok.html"]);
    });

    it("never adopts a symlink", () => {
        const target = path.join(top, "outside.html");
        fs.writeFileSync(target, "abcd");
        fs.symlinkSync(target, path.join(files, "a.html"));
        writeListing(listing, [["a.html", 4, "e1"]]);
        const result = plan();
        assert.deepEqual(result.adopted, []);
        assert.deepEqual(result.mcp, ["a.html"]);
    });

    it("sends large text files to manual export", () => {
        writeListing(listing, [["big.js", d.MCP_LIMIT + 1, "e1"]]);
        assert.deepEqual(plan().manual, ["big.js"]);
    });
});
