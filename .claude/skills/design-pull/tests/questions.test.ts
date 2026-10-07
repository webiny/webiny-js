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
                id: "BZ-1",
                status: "open",
                date: "2026-10-07",
                file: "A B.html",
                text: "Why?\n# not a heading\n> not a quote\nfile: nope",
                answer: ""
            },
            {
                id: "BZ-2",
                status: "answered",
                date: "2026-10-08",
                file: "",
                text: "Second",
                answer: "Line one\n\n## QBZ-7 fake"
            }
        ];
        const rendered = d.renderQuestions(questions);
        assert.deepEqual(d.parseQuestions(rendered), questions);
        assert.equal(rendered.includes("\n## QBZ-7"), false);
    });

    it("parses answer sections by prefixed ID, last one per ID wins", () => {
        const text =
            "intro\n## QBZ-1 — title\nfirst\n### QMK-2\nother\n## QBZ-1\nsecond\n## QBZ-3\n   \n##\nQBZ-4\nnot a heading\n";
        assert.deepEqual(
            d.parseAnswers(text),
            new Map([
                ["BZ-1", "second"],
                ["MK-2", "other"],
                ["BZ-3", "##\nQBZ-4\nnot a heading"]
            ])
        );
    });
});

describe("question commands", () => {
    let top = "";
    let folder = "";
    let items = "";

    beforeEach(() => {
        top = makeRepo();
        runCli(top, "init", "d", "--project", "P", "--project-id", "u", "--question-prefix", "BZ");
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

    it("allocates prefixed IDs, drops duplicates and lists open questions", () => {
        let out = add([
            { file: "A.html", text: "Bulk approve?" },
            { file: "", text: "Empty state?" }
        ]);
        assert.deepEqual(
            out.added.map((a: any) => a.id),
            ["BZ-1", "BZ-2"]
        );
        out = add([
            { file: "A.html", text: "  Bulk approve? " },
            { file: "B.html", text: "Colors?" }
        ]);
        assert.deepEqual(out.duplicates, [{ id: "BZ-1", text: "Bulk approve?" }]);
        assert.deepEqual(
            out.added.map((a: any) => a.id),
            ["BZ-3"]
        );
        fs.writeFileSync(
            path.join(folder, "answers.md"),
            "## QBZ-9\nmine elsewhere\n## QMK-40\ntheirs\n"
        );
        out = add([{ file: "", text: "Next?" }]);
        assert.equal(out.added[0].id, "BZ-10");
        assert.deepEqual(
            runJson(top, "ask-open", folder).map((q: any) => q.id),
            ["BZ-1", "BZ-2", "BZ-3", "BZ-10"]
        );
    });

    it("matches only its own answers, idempotently, and reports changes", () => {
        add([
            { file: "A.html", text: "Bulk approve?" },
            { file: "", text: "Empty state?" }
        ]);
        fs.writeFileSync(
            path.join(folder, "answers.md"),
            "## QBZ-1\nYes, add it.\n## QBZ-2\n\n## QBZ-5\nOrphan\n## QMK-1\nSomeone else's answer\n"
        );
        const planFile = path.join(top, "plan.json");
        fs.writeFileSync(planFile, JSON.stringify({ answers_result: null }));
        let out = runJson(top, "answers", folder, "--plan", planFile);
        assert.deepEqual(out, { answered: ["BZ-1"], changed: [], unknown: ["BZ-5"] });
        assert.deepEqual(JSON.parse(fs.readFileSync(planFile, "utf8")).answers_result, out);
        const log = fs.readFileSync(path.join(folder, "questions.md"), "utf8");
        assert.ok(log.includes("## QBZ-1 — answered —"));
        assert.ok(log.includes("> Yes, add it."));
        assert.ok(log.includes("## QBZ-2 — open —"));
        assert.equal(log.includes("Someone else"), false);

        out = runJson(top, "answers", folder);
        assert.deepEqual(out, { answered: [], changed: [], unknown: ["BZ-5"] });
        assert.equal(fs.readFileSync(path.join(folder, "questions.md"), "utf8"), log);

        fs.writeFileSync(path.join(folder, "answers.md"), "## QBZ-1\nNo, skip it.\n");
        out = runJson(top, "answers", folder);
        assert.deepEqual(out.changed, ["BZ-1"]);
        assert.ok(
            fs.readFileSync(path.join(folder, "questions.md"), "utf8").includes("> No, skip it.")
        );
    });

    it("does nothing without answers.md", () => {
        assert.deepEqual(runJson(top, "answers", folder), {
            answered: [],
            changed: [],
            unknown: []
        });
    });

    it("refuses folders without a catalogue", () => {
        fs.writeFileSync(items, JSON.stringify([{ file: "", text: "Q?" }]));
        assert.equal(runCli(top, "ask-add", path.join(top, "typo"), items).status, 1);
        assert.equal(fs.existsSync(path.join(top, "typo")), false);
        assert.equal(runCli(top, "ask-open", path.join(top, "typo")).status, 1);
        assert.equal(runCli(top, "answers", path.join(top, "typo")).status, 1);
    });

    it("reports invalid question JSON as an error", () => {
        fs.writeFileSync(items, "[{'file': '', 'text': 'Q?'}]");
        const result = runCli(top, "ask-add", folder, items);
        assert.equal(result.status, 1);
        assert.ok(result.stderr.startsWith("error:"), result.stderr);
    });

    it("refuses a catalogue without a question prefix", () => {
        const cat = d.loadCatalogue(folder);
        cat.questionPrefix = "";
        d.saveCatalogue(folder, cat);
        fs.writeFileSync(items, JSON.stringify([{ file: "", text: "Q?" }]));
        const result = runCli(top, "ask-add", folder, items);
        assert.equal(result.status, 1);
        assert.ok(result.stderr.includes("set-prefix"), result.stderr);
    });
});
