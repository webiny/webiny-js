import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as d from "../lib.ts";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "design-pull-"));

describe("validateRelPath", () => {
    it("accepts normal paths", () => {
        for (const p of [
            "a.html",
            "Content Review.dc.html",
            "_ds/x/kit.css",
            "assets/webiny-avatar.svg"
        ]) {
            assert.equal(d.validateRelPath(p), p);
        }
    });

    it("rejects unsafe paths", () => {
        for (const p of [
            "",
            "/etc/passwd",
            "~/x",
            "a/../b",
            "..",
            "./a",
            "a//b",
            "a\\b",
            "a\x00b",
            "a\nb",
            "a/"
        ]) {
            assert.throws(() => d.validateRelPath(p), d.DesignError, JSON.stringify(p));
        }
    });
});

describe("safeJoin", () => {
    it("joins inside the root", () => {
        const root = tmp();
        assert.equal(d.safeJoin(root, "x/y.html"), path.join(root, "x", "y.html"));
    });

    it("rejects a symlinked parent directory", () => {
        const root = tmp();
        fs.symlinkSync(tmp(), path.join(root, "link"));
        assert.throws(() => d.safeJoin(root, "link/file.html"), d.DesignError);
    });
});

describe("collisionKey", () => {
    it("folds case and unicode form", () => {
        assert.equal(d.collisionKey("Foo.html"), d.collisionKey("foo.HTML"));
        assert.equal(d.collisionKey("é.html"), d.collisionKey("é.html"));
    });
});

describe("atomicWriteBytes", () => {
    it("writes and creates parent directories without leftovers", () => {
        const target = path.join(tmp(), "a", "b.txt");
        d.atomicWriteBytes(target, Buffer.from("hello"));
        assert.equal(fs.readFileSync(target, "utf8"), "hello");
        assert.deepEqual(fs.readdirSync(path.dirname(target)), ["b.txt"]);
    });

    it("replaces a symlink instead of writing through it", () => {
        const root = tmp();
        const outside = path.join(root, "outside.txt");
        fs.writeFileSync(outside, "keep");
        const link = path.join(root, "link.txt");
        fs.symlinkSync(outside, link);
        d.atomicWriteBytes(link, Buffer.from("new"));
        assert.equal(fs.readFileSync(outside, "utf8"), "keep");
        assert.equal(fs.lstatSync(link).isSymbolicLink(), false);
        assert.equal(fs.readFileSync(link, "utf8"), "new");
    });
});

describe("isText", () => {
    it("classifies by extension", () => {
        assert.equal(d.isText("x/Kit.CSS"), true);
        assert.equal(d.isText("a.dc.html"), true);
        assert.equal(d.isText(".thumbnail"), false);
        assert.equal(d.isText("img.png"), false);
    });
});
