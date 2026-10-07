import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as d from "../lib.ts";

describe("matches", () => {
    it("does not let * cross a slash", () => {
        assert.equal(d.matches("a.html", ["*.html"]), true);
        assert.equal(d.matches("x/a.html", ["*.html"]), false);
    });

    it("handles **", () => {
        assert.equal(d.matches("_ds/x/ui_kits/kit.css", ["_ds/**"]), true);
        assert.equal(d.matches("design_handoff_workflows/README.md", ["design_handoff_*/**"]), true);
        assert.equal(d.matches("a/b/c.css", ["**/c.css"]), true);
        assert.equal(d.matches("c.css", ["**/c.css"]), true);
    });

    it("matches exact paths only from the root", () => {
        assert.equal(d.matches(".thumbnail", d.DEFAULT_EXCLUDE), true);
        assert.equal(d.matches("x/.thumbnail", [".thumbnail"]), false);
    });

    it("lets the last match win, with ! negation", () => {
        const patterns = ["design_handoff_*/**", "!design_handoff_*/README.md"];
        assert.equal(d.matches("design_handoff_w/README.md", patterns), false);
        assert.equal(d.matches("design_handoff_w/a.html", patterns), true);
    });

    it("handles ? and escapes regex characters", () => {
        assert.equal(d.matches("a1.html", ["a?.html"]), true);
        assert.equal(d.matches("a/.html", ["a?.html"]), false);
        assert.equal(d.matches("a+b.html", ["a+b.html"]), true);
    });

    it("matches nothing without patterns", () => {
        assert.equal(d.matches("a.html", []), false);
    });
});
