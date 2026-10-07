import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as d from "../lib.ts";
import { makeRepo, runCli, runJson } from "./helpers.ts";

describe("question model", () => {
    it("normalizes whitespace", () => {
        assert.equal(d.normalize("  a  \n\n\n\nb \n"), "a\n\nb");
    });

    it("round-trips tricky lines", () => {
        const questions: d.Question[] = [
            {
                id: 1,
                status: "open",
                date: "2026-10-07",
                file: "A B.html",
                text: "Why?\n# not a heading\n> not a quote\nfile: nope",
                answer: ""
            },
            { id: 2, status: "answered", date: "2026-10-08", file: "", text: "Second", answer: "Line one\n\n## Q7 fake" }
        ];
        const rendered = d.renderQuestions(questions);
        assert.deepEqual(d.parseQuestions(rendered), questions);
        assert.equal(rendered.includes("\n## Q7"), false);
    });

    it("parses answer sections, last one per ID wins", () => {
        const text = "intro\n## Q1 — title\nfirst\n### Q2\n\n## Q1\nsecond\n## Q3\n   \n";
        assert.deepEqual(d.parseAnswers(text), new Map([
            [1, "second"],
            [2, ""],
            [3, ""]
        ]));
    });
});

describe("question commands", () => {
    let top = "";
    let folder = "";
    let items = "";

    beforeEach(() => {
        top = makeRepo();
        runCli(top, "init", "d", "--project", "P", "--project-id", "u");
        folder = path.join(top, "d");
        items = path.join(top, "items.json");
    });
    afterEach(() => {
        fs.rmSync(top, { recursive: true, force: true });
    });

    const add = (list: Array<{ file: string; text: string }>) => {
        fs.writeFileSync(items, JSON.stringify(list));
        return runJson(top, "ask-add", folder, items);
    };

    it("allocates IDs, drops duplicates and lists open questions", () => {
        let out = add([
            { file: "A.html", text: "Bulk approve?" },
            { file: "", text: "Empty state?" }
        ]);
        assert.deepEqual(out.added.map((a: any) => a.id), [1, 2]);
        out = add([
            { file: "A.html", text: "  Bulk approve? " },
            { file: "B.html", text: "Colors?" }
        ]);
        assert.deepEqual(out.duplicates, [{ id: 1, text: "Bulk approve?" }]);
        assert.deepEqual(out.added.map((a: any) => a.id), [3]);
        fs.writeFileSync(path.join(folder, "answers.md"), "## Q9\nfrom another log\n");
        out = add([{ file: "", text: "Next?" }]);
        assert.equal(out.added[0].id, 10);
        assert.deepEqual(runJson(top, "ask-open", folder).map((q: any) => q.id), [1, 2, 3, 10]);
    });

    it("matches answers idempotently and reports changes", () => {
        add([
            { file: "A.html", text: "Bulk approve?" },
            { file: "", text: "Empty state?" }
        ]);
        fs.writeFileSync(path.join(folder, "answers.md"), "## Q1\nYes, add it.\n## Q2\n\n## Q5\nOrphan\n");
        const planFile = path.join(top, "plan.json");
        fs.writeFileSync(planFile, JSON.stringify({ answers_result: null }));
        let out = runJson(top, "answers", folder, "--plan", planFile);
        assert.deepEqual(out, { answered: [1], changed: [], unknown: [5] });
        assert.deepEqual(JSON.parse(fs.readFileSync(planFile, "utf8")).answers_result, out);
        const log = fs.readFileSync(path.join(folder, "questions.md"), "utf8");
        assert.ok(log.includes("## Q1 — answered —"));
        assert.ok(log.includes("> Yes, add it."));
        assert.ok(log.includes("## Q2 — open —"));

        out = runJson(top, "answers", folder);
        assert.deepEqual(out, { answered: [], changed: [], unknown: [5] });
        assert.equal(fs.readFileSync(path.join(folder, "questions.md"), "utf8"), log);

        fs.writeFileSync(path.join(folder, "answers.md"), "## Q1\nNo, skip it.\n");
        out = runJson(top, "answers", folder);
        assert.deepEqual(out.changed, [1]);
        assert.ok(fs.readFileSync(path.join(folder, "questions.md"), "utf8").includes("> No, skip it."));
    });

    it("does nothing without answers.md", () => {
        assert.deepEqual(runJson(top, "answers", folder), { answered: [], changed: [], unknown: [] });
    });
});
