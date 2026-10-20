import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as d from "../lib.ts";
import { gitOutput, makeRepo, runCli, runJson } from "./helpers.ts";

describe("mark and unmark", () => {
    let top = "";
    let folder = "";

    beforeEach(() => {
        top = makeRepo();
        runCli(top, "init", "d", "--project", "P", "--project-id", "u", "--question-prefix", "T");
        folder = path.join(top, "d");
        fs.mkdirSync(path.join(folder, "files"));
        fs.writeFileSync(path.join(folder, "files/A B.html"), "design");
        fs.writeFileSync(path.join(folder, "files/support.js"), "js");
        const cat = d.loadCatalogue(folder);
        cat.rows["A B.html"] = d.createRow("A B.html", { etagPulled: "e2" });
        cat.rows["support.js"] = d.createRow("support.js", { kind: "support", etagPulled: "s1" });
        cat.rows["gone.html"] = d.createRow("gone.html", {
            etagPulled: "g1",
            removedAt: "2026-10-07T00:00:00Z"
        });
        d.saveCatalogue(folder, cat);
    });
    afterEach(() => {
        fs.rmSync(top, { recursive: true, force: true });
    });

    it("marks with commit and etag", () => {
        const out = runJson(top, "mark", folder, "A B.html", "--etag", "e2", "--commit", "abc123");
        assert.deepEqual(out.done, ["A B.html"]);
        const row = d.loadCatalogue(folder).rows["A B.html"];
        assert.deepEqual([row.etagImplemented, row.commit], ["e2", "abc123"]);
        assert.equal(fs.readFileSync(path.join(folder, ".implemented/A B.html"), "utf8"), "design");
    });

    it("defaults to HEAD on a clean tree", () => {
        const out = runJson(top, "mark", folder, "A B.html");
        assert.deepEqual(out.warnings, []);
        assert.equal(
            d.loadCatalogue(folder).rows["A B.html"].commit,
            gitOutput(top, "rev-parse", "HEAD")
        );
    });

    it("warns on a dirty tree", () => {
        fs.writeFileSync(path.join(top, "README"), "changed");
        assert.equal(runJson(top, "mark", folder, "A B.html").warnings.length, 1);
    });

    it("checks preconditions", () => {
        let out = runJson(top, "mark", folder, "A B.html", "--etag", "old", "--commit", "c");
        assert.deepEqual(out.done, []);
        assert.ok(out.skipped[0].reason.includes("e2"));
        out = runJson(
            top,
            "mark",
            folder,
            "support.js",
            "gone.html",
            "missing.html",
            "--commit",
            "c"
        );
        assert.deepEqual(
            out.skipped.map((s: any) => s.file),
            ["support.js", "gone.html", "missing.html"]
        );
        assert.equal(d.loadCatalogue(folder).rows["A B.html"].etagImplemented, "");
    });

    it("unmarks", () => {
        runJson(top, "mark", folder, "A B.html", "--commit", "c");
        const out = runJson(top, "unmark", folder, "A B.html", "support.js");
        assert.deepEqual(out.done, ["A B.html"]);
        assert.deepEqual(out.skipped, [{ file: "support.js", reason: "not marked" }]);
        const row = d.loadCatalogue(folder).rows["A B.html"];
        assert.deepEqual([row.etagImplemented, row.implementedAt, row.commit], ["", "", ""]);
        assert.equal(fs.existsSync(path.join(folder, ".implemented/A B.html")), false);
    });

    it("keeps the catalogue consistent when one file in a batch fails", () => {
        const cat = d.loadCatalogue(folder);
        cat.rows["C.html"] = d.createRow("C.html", {
            etagPulled: "c1",
            etagImplemented: "c1",
            commit: "x"
        });
        d.saveCatalogue(folder, cat);
        runJson(top, "mark", folder, "A B.html", "--commit", "c");
        fs.mkdirSync(path.join(folder, ".implemented/C.html"), { recursive: true });
        const out = runJson(top, "unmark", folder, "A B.html", "C.html");
        assert.deepEqual(out.done, ["A B.html"]);
        assert.deepEqual(
            out.skipped.map((s: any) => s.file),
            ["C.html"]
        );
        assert.equal(d.loadCatalogue(folder).rows["A B.html"].etagImplemented, "");
        assert.equal(d.loadCatalogue(folder).rows["C.html"].etagImplemented, "c1");
    });
});
