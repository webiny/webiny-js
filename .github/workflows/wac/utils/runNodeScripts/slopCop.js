// "Slop cop" PR analyzer. Reads a pull request's stated intent (title/body),
// its footprint (per-file additions/deletions, commit list) and a capped raw
// diff, then asks Claude two things:
//   (A) integrity - does anything look like it should NOT be in the PR? e.g. a
//       bad rebase/merge that wiped commits (the footprint does not match the
//       stated intent), leaked secrets, committed debug code, conflict markers.
//   (B) style - do the diff's added lines break any project code-style rule?
//       (only when CODE_STYLE_DIR is provided; otherwise skipped.)
//
// This script ONLY analyzes and prints a Markdown report to a file. It never
// blocks and never touches GitHub - posting the sticky comment is the caller's
// job (a `gh` step). On ANY failure it writes nothing and exits 0, so a flaky
// API call or a bad key can never fail a PR.
//
// Inputs (all via env):
//   ANTHROPIC_API_KEY  - required; if missing, exit 0 without a report.
//   ANTHROPIC_MODEL    - model id (default: claude-sonnet-5).
//   PR_JSON_FILE       - path to `gh pr view --json ...` output (title, body,
//                        additions, deletions, changedFiles, commits, files,
//                        baseRefName, headRefName).
//   DIFF_FILE          - path to the raw unified diff (may be truncated).
//   CODE_STYLE_DIR     - optional; dir of `*.md` code-style rule files. When set,
//                        the analysis also checks the diff's added lines against
//                        those rules. Absent/empty -> code-style check is skipped.
//   SLOP_COP_OUTPUT    - path to write the Markdown report to.
//
// Output file contract for the caller: if the file is written and non-empty,
// post it as a comment; if it is absent or empty, post nothing.

import fs from "fs";
import path from "path";

const MARKER = "<!-- slop-cop -->";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const MAX_DIFF_BYTES = 200_000;
const MAX_RULES_BYTES = 60_000;

const readFileSafe = path => {
    if (!path) {
        return "";
    }
    try {
        return fs.readFileSync(path, "utf8");
    } catch {
        return "";
    }
};

const truncate = (text, max) => {
    if (text.length <= max) {
        return { text, truncated: false };
    }
    return {
        text: text.slice(0, max),
        truncated: true
    };
};

const loadPr = () => {
    try {
        return JSON.parse(readFileSafe(process.env.PR_JSON_FILE) || "{}");
    } catch {
        return {};
    }
};

// Concatenate every `*.md` rule file (except the README index) into one block,
// each prefixed with its filename so the model can cite the rule it broke.
// Returns "" when the dir is unset/missing, which turns the style check off.
const loadCodeStyleRules = () => {
    const dir = process.env.CODE_STYLE_DIR;
    if (!dir) {
        return "";
    }

    let names;
    try {
        names = fs.readdirSync(dir);
    } catch {
        return "";
    }

    const rules = names
        .filter(name => name.endsWith(".md") && name.toLowerCase() !== "readme.md")
        .sort()
        .map(name => `--- RULE: ${name} ---\n${readFileSafe(path.join(dir, name))}`)
        .join("\n\n");

    return truncate(rules, MAX_RULES_BYTES).text;
};

const buildPrompt = pr => {
    // Keep only the fields the model needs, and drop GitHub's verbose commit
    // objects down to their headlines.
    const files = (pr.files || []).map(f => ({
        path: f.path,
        additions: f.additions,
        deletions: f.deletions
    }));
    const commits = (pr.commits || [])
        .map(c => c.messageHeadline || (c.messageBody || "").split("\n")[0])
        .filter(Boolean)
        .join("\n");

    const filesJson = JSON.stringify(files);
    const { text: diff, truncated } = truncate(readFileSafe(process.env.DIFF_FILE), MAX_DIFF_BYTES);
    const rules = loadCodeStyleRules();

    return [
        "You are reviewing a GitHub pull request for a large TypeScript monorepo",
        "(the Webiny framework). You have two jobs.",
        "",
        'JOB A ("integrity") - catch content that most likely should NOT be in the',
        "PR: things the author probably did by accident and would want to know about",
        "BEFORE merging. This is NOT general code-quality review; ignore normal",
        "design/naming/refactor opinions. Look specifically for:",
        "  1. FOOTPRINT MISMATCH (highest priority): the stated intent (title/body)",
        "     is narrow (a fix, a single feature) but the diff deletes a large number",
        "     of files or lines, or touches unrelated areas. This is the classic",
        "     signature of a bad rebase/merge or a force-push that silently DESTROYED",
        "     commits. Weigh the per-file deletions against what the title implies.",
        "  2. Leaked secrets/credentials: API keys, tokens, passwords, private keys,",
        "     committed .env files.",
        "  3. Accidentally committed artifacts: node_modules, build output, large",
        "     binaries, lockfile churn unrelated to the change.",
        "  4. Leftover debug/dev code: stray console.log/debugger, focused tests",
        "     (.only), commented-out large blocks, hardcoded local paths/URLs.",
        "  5. Unresolved merge conflict markers (<<<<<<<, =======, >>>>>>>).",
        "  6. Commit-list smells: many unrelated commits, or revert/wip/fixup noise",
        "     suggesting the branch history is not what the author intended.",
        "",
        rules
            ? [
                  'JOB B ("style") - check the code the PR ADDS or CHANGES against the',
                  "project's code-style rules, listed under CODE-STYLE RULES below. Only",
                  "flag lines the diff actually adds or modifies (added lines start with",
                  "'+' in the raw diff) - never pre-existing/unchanged code, and never",
                  "removed lines. For each violation, cite the file and the rule filename",
                  "(e.g. one-import-per-line.md). Respect each rule's scope (e.g.",
                  "no-console-in-backend applies only to api-* / backend code). Be precise",
                  "and conservative - skip anything you are not confident violates a rule -",
                  "and report at most the ~15 most important style violations."
              ].join("\n")
            : 'JOB B is DISABLED for this run (no code-style rules provided). Do not report any "style" findings.',
        "",
        "Be conservative overall: only report a finding when you are reasonably",
        "confident. A large but coherent PR (its diff matches its intent) with no rule",
        "violations is FINE - say so. Do NOT invent problems to look useful.",
        "",
        "Respond with ONLY a JSON object, no prose, no markdown fences:",
        '{ "verdict": "ok" | "warnings",',
        '  "summary": "<one short sentence>",',
        '  "findings": [ { "category": "integrity"|"style", "severity": "high"|"medium"|"low",',
        '                  "title": "<short>", "detail": "<1-3 sentences; cite files/lines/rule>" } ] }',
        'If nothing is worth flagging, return verdict "ok" with an empty findings array.',
        "",
        ...(rules ? ["=== CODE-STYLE RULES ===", rules, ""] : []),
        "=== PR TITLE ===",
        pr.title || "(none)",
        "",
        "=== PR DESCRIPTION ===",
        (pr.body || "(none)").slice(0, 8000),
        "",
        "=== BRANCHES ===",
        `base: ${pr.baseRefName || "?"}  head: ${pr.headRefName || "?"}`,
        "",
        "=== TOTALS ===",
        `changed files: ${pr.changedFiles ?? "?"}, +${pr.additions ?? "?"} -${pr.deletions ?? "?"}`,
        "",
        "=== COMMITS ===",
        (commits || "(none)").slice(0, 8000),
        "",
        "=== PER-FILE CHANGES (path, +added, -deleted) ===",
        filesJson.slice(0, 40000),
        "",
        "=== RAW DIFF" + (truncated ? " (TRUNCATED - footprint above is complete)" : "") + " ===",
        diff || "(diff unavailable)"
    ].join("\n");
};

const callClaude = async prompt => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
            model: MODEL,
            max_tokens: 4000,
            messages: [{ role: "user", content: prompt }]
        })
    });

    if (!res.ok) {
        throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const text = (data.content || [])
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("");

    return text;
};

// The model is asked for bare JSON, but strip accidental ```json fences just in case.
const parseResult = text => {
    const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) {
        throw new Error("No JSON object in model response.");
    }
    return JSON.parse(cleaned.slice(start, end + 1));
};

const SEVERITY = {
    high: { emoji: "🔴", label: "High" },
    medium: { emoji: "🟠", label: "Medium" },
    low: { emoji: "🟡", label: "Low" }
};

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

// Render one "### severity — title / detail" block per finding, sorted high -> low.
const renderFindings = (lines, findings) => {
    findings
        .slice()
        .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3))
        .forEach(f => {
            const sev = SEVERITY[f.severity] || { emoji: "⚪", label: f.severity || "Note" };
            lines.push(`### ${sev.emoji} ${sev.label} — ${f.title || "Finding"}`);
            lines.push("");
            lines.push(f.detail || "");
            lines.push("");
        });
};

const renderReport = result => {
    const findings = Array.isArray(result.findings) ? result.findings : [];
    // Anything not explicitly tagged "style" is treated as an integrity finding.
    const style = findings.filter(f => f.category === "style");
    const integrity = findings.filter(f => f.category !== "style");
    const lines = [MARKER, "## 🚓 Slop Cop", ""];

    if (result.verdict !== "warnings" || findings.length === 0) {
        lines.push(
            "✅ Nothing worth flagging. The diff looks consistent with the PR's stated intent and the code-style rules."
        );
        if (result.summary) {
            lines.push("", `_${result.summary}_`);
        }
    } else {
        lines.push(`⚠️ **${findings.length} thing(s) worth a look before merging.**`);
        if (result.summary) {
            lines.push("", result.summary);
        }
        lines.push("");

        if (integrity.length > 0) {
            lines.push("## 🚨 Should this be in the PR?", "");
            renderFindings(lines, integrity);
        }
        if (style.length > 0) {
            lines.push("## 📏 Code-style rule checks", "");
            renderFindings(lines, style);
        }
    }

    lines.push("");
    lines.push(
        "<sub>Automated, non-blocking heads-up from an LLM. It can be wrong — use your judgment. " +
            "Regenerates on every push.</sub>"
    );
    return lines.join("\n");
};

const main = async () => {
    if (!process.env.ANTHROPIC_API_KEY) {
        console.log("ANTHROPIC_API_KEY not set - skipping slop cop analysis.");
        return;
    }

    const outputPath = process.env.SLOP_COP_OUTPUT;
    if (!outputPath) {
        console.log("SLOP_COP_OUTPUT not set - nothing to write.");
        return;
    }

    const text = await callClaude(buildPrompt(loadPr()));
    const result = parseResult(text);
    fs.writeFileSync(outputPath, renderReport(result), "utf8");
    console.log(`Slop cop report written (verdict: ${result.verdict}).`);
};

main().catch(err => {
    // Non-blocking by design: never fail the PR because analysis broke.
    console.log(`Slop cop analysis failed (non-blocking): ${err.message}`);
    process.exit(0);
});
