import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as d from "../lib.ts";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "design-pull-"));

const sample = (): d.Catalogue => {
    const cat = d.createCatalogue("Workflows", "uuid-1");
    cat.rows["Content Review.dc.html"] = d.createRow("Content Review.dc.html", {
        etagPulled: "2",
        pulledAt: "2026-10-07T10:00:00Z",
        etagImplemented: "1"
    });
    cat.rows["a|b.html"] = d.createRow("a|b.html", { etagPulled: "5" });
    cat.rows["support.js"] = d.createRow("support.js", { kind: "support", etagPulled: "9" });
    return cat;
};

describe("rowStatus", () => {
    it("applies the documented order", () => {
        const cat = sample();
        const row = cat.rows["Content Review.dc.html"];
        assert.equal(d.rowStatus(cat, row), "pending");
        row.etagImplemented = "2";
        assert.equal(d.rowStatus(cat, row), "implemented");
        row.etagImplemented = "";
        assert.equal(d.rowStatus(cat, row), "new");
        assert.equal(d.rowStatus(cat, cat.rows["support.js"]), "support");
        cat.exclude.push("support.js");
        assert.equal(d.rowStatus(cat, cat.rows["support.js"]), "excluded");
        cat.rows["support.js"].removedAt = "2026-10-07T11:00:00Z";
        assert.equal(d.rowStatus(cat, cat.rows["support.js"]), "removed");
    });
});

describe("catalogue round trip", () => {
    it("renders and parses back to the same catalogue", () => {
        const cat = sample();
        cat.lastPull = "2026-10-07T10:00:00Z";
        cat.answersEtag = "77";
        const text = d.renderCatalogue(cat);
        const again = d.parseCatalogue(text);
        assert.equal(again.project, "Workflows");
        assert.equal(again.projectId, "uuid-1");
        assert.deepEqual(again.exclude, d.DEFAULT_EXCLUDE);
        assert.deepEqual(again.support, d.DEFAULT_SUPPORT);
        assert.equal(again.lastPull, "2026-10-07T10:00:00Z");
        assert.equal(again.answersEtag, "77");
        assert.deepEqual(again.rows, cat.rows);
        assert.ok(text.includes("a\\|b.html"));
        assert.ok(text.includes("| pending |"));
    });

    it("keeps empty lists and values", () => {
        const cat = d.createCatalogue("P", "u");
        cat.exclude = [];
        cat.support = [];
        const again = d.parseCatalogue(d.renderCatalogue(cat));
        assert.deepEqual(again.exclude, []);
        assert.deepEqual(again.support, []);
        assert.equal(again.lastPull, "");
        assert.deepEqual({ ...again.rows }, {});
    });

    it("rejects a file without header", () => {
        assert.throws(() => d.parseCatalogue("| file |\n"), d.DesignError);
    });
});

describe("catalogue files", () => {
    it("saves and loads", () => {
        const folder = tmp();
        d.saveCatalogue(folder, sample());
        assert.deepEqual(d.loadCatalogue(folder).rows, sample().rows);
    });

    it("fails when missing", () => {
        assert.throws(() => d.loadCatalogue(tmp()), d.DesignError);
    });
});

describe("source paths and kind", () => {
    it("uses the root source as is", () => {
        const cat = d.createCatalogue("P", "u");
        assert.equal(d.toSourceRel(cat, "a/b.html"), "a/b.html");
        assert.equal(d.toProjectPath(cat, "a/b.html"), "a/b.html");
    });

    it("strips and adds a sub source", () => {
        const cat = d.createCatalogue("P", "u");
        cat.source = "/screens/";
        assert.equal(d.toSourceRel(cat, "screens/a.html"), "a.html");
        assert.equal(d.toSourceRel(cat, "other/a.html"), null);
        assert.equal(d.toProjectPath(cat, "a.html"), "screens/a.html");
    });

    it("derives the kind from support patterns", () => {
        const cat = d.createCatalogue("P", "u");
        assert.equal(d.kindFor(cat, "_ds/x/kit.css"), "support");
        assert.equal(d.kindFor(cat, "Picker.dc.html"), "screen");
    });
});
