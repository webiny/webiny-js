import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as d from "../lib.ts";
import { gitOutput, makeRepo, runCli, runJson, tmpDir } from "./helpers.ts";

describe("gitignore escaping", () => {
    it("round-trips special characters", () => {
        for (const s of ["docs/design", "docs/a*b?[c]/d!e#f", "x\\y"]) {
            assert.equal(d.unescapeGitignore(d.escapeGitignore(s)), s);
        }
        assert.equal(d.escapeGitignore("a*b"), "a\\*b");
    });
});

describe("loadListing", () => {
    it("loads the JSON array and skips directories", () => {
        const file = path.join(tmpDir(), "l.json");
        fs.writeFileSync(
            file,
            'prefix text [{"path":"a.html","type":"file","size":3,"etag":"1"},' +
                '{"path":"x","type":"directory","size":0,"etag":"0"}] trailing'
        );
        assert.deepEqual({ ...d.loadListing(file) }, { "a.html": { size: 3, etag: "1" } });
    });

    it("rejects entries without a valid path, size or etag", () => {
        const file = path.join(tmpDir(), "l.json");
        for (const bad of [
            "Error: project not found [404]",
            '[{"path":"a.html","type":"file","size":"x","etag":"1"}]',
            '[{"type":"file","size":1,"etag":"1"}]',
            '[{"path":"a.html","type":"file","size":1}]'
        ]) {
            fs.writeFileSync(file, bad);
            assert.throws(() => d.loadListing(file), d.DesignError, bad);
        }
    });

    it("fails without an array", () => {
        const file = path.join(tmpDir(), "l.json");
        fs.writeFileSync(file, "nothing");
        assert.throws(() => d.loadListing(file), d.DesignError);
    });
});

describe("init and list-folders", () => {
    let top = "";
    beforeEach(() => {
        top = makeRepo();
    });
    afterEach(() => {
        fs.rmSync(top, { recursive: true, force: true });
    });

    it("writes the header and an anchored exclude entry", () => {
        fs.mkdirSync(path.join(top, "docs/my design/files"), { recursive: true });
        const out = runJson(
            top,
            "init",
            "docs/my design",
            "--project",
            "Workflows",
            "--project-id",
            "uuid-1",
            "--question-prefix",
            "BZ"
        );
        assert.equal(out.folder, "docs/my design");
        const cat = d.loadCatalogue(path.join(top, "docs/my design"));
        assert.deepEqual([cat.projectId, cat.questionPrefix], ["uuid-1", "BZ"]);
        const exclude = fs.readFileSync(path.join(top, ".git/info/exclude"), "utf8");
        assert.ok(exclude.includes("/docs/my design/\n"));
        assert.deepEqual(runJson(top, "list-folders"), [
            { folder: "docs/my design", project: "Workflows" }
        ]);
        assert.equal(gitOutput(top, "status", "--porcelain"), "");
    });

    it("refuses an existing catalogue and folders outside the repository", () => {
        runCli(
            top,
            "init",
            "docs/d",
            "--project",
            "P",
            "--project-id",
            "u",
            "--question-prefix",
            "T"
        );
        assert.equal(
            runCli(
                top,
                "init",
                "docs/d",
                "--project",
                "P",
                "--project-id",
                "u",
                "--question-prefix",
                "T"
            ).status,
            1
        );
        assert.equal(
            runCli(
                top,
                "init",
                "../elsewhere",
                "--project",
                "P",
                "--project-id",
                "u",
                "--question-prefix",
                "T"
            ).status,
            1
        );
    });

    it("does not duplicate the exclude entry", () => {
        runCli(
            top,
            "init",
            "docs/d",
            "--project",
            "P",
            "--project-id",
            "u",
            "--question-prefix",
            "T"
        );
        fs.rmSync(path.join(top, "docs/d/catalogue.md"));
        runCli(
            top,
            "init",
            "docs/d",
            "--project",
            "P",
            "--project-id",
            "u",
            "--question-prefix",
            "T"
        );
        const exclude = fs.readFileSync(path.join(top, ".git/info/exclude"), "utf8");
        assert.equal(exclude.split("/docs/d/").length - 1, 1);
    });

    it("rejects unknown commands and missing options", () => {
        assert.equal(runCli(top, "nope").status, 64);
        assert.equal(runCli(top, "init", "docs/d").status, 1);
        assert.equal(
            runCli(top, "init", "docs/d", "--project", "P", "--project-id", "u").status,
            1
        );
    });

    it("validates and changes the question prefix", () => {
        assert.equal(
            runCli(
                top,
                "init",
                "docs/d",
                "--project",
                "P",
                "--project-id",
                "u",
                "--question-prefix",
                "b-z"
            ).status,
            1
        );
        runCli(
            top,
            "init",
            "docs/d",
            "--project",
            "P",
            "--project-id",
            "u",
            "--question-prefix",
            "BZ"
        );
        assert.equal(runCli(top, "set-prefix", "docs/d", "x y").status, 1);
        runJson(top, "set-prefix", "docs/d", "MK");
        assert.equal(d.loadCatalogue(path.join(top, "docs/d")).questionPrefix, "MK");
    });

    it("rejects control characters in the project name and id", () => {
        assert.equal(
            runCli(
                top,
                "init",
                "docs/d",
                "--project",
                "a\nb",
                "--project-id",
                "u",
                "--question-prefix",
                "T"
            ).status,
            1
        );
        assert.equal(
            runCli(
                top,
                "init",
                "docs/d",
                "--project",
                "P",
                "--project-id",
                "u\tv",
                "--question-prefix",
                "T"
            ).status,
            1
        );
    });
});
