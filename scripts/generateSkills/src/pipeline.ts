/**
 * Pipeline — discovers all exported abstractions and emits per-category SKILL.md generated.
 */
import fs from "fs";
import path from "path";
import { discover } from "./discovery.js";
import {
    createProject,
    followReExport,
    getPackagePath,
    getJsDoc,
    isTypeExport
} from "./source-resolver.js";
import { deriveCategory, getHowToUse } from "./config.js";
import type { CliOptions, CatalogEntry } from "./types.js";

export function run(opts: CliOptions): void {
    const repoRoot = opts.repoRoot || process.cwd();
    const outputDir = path.resolve(repoRoot, opts.output || "skills/user-skills");
    const format = opts.format || "cards";

    console.log("Initializing ts-morph project...");
    const project = createProject(repoRoot);

    // Step 1: Discovery
    console.log("Discovering exports...");
    let discovered = discover(project, repoRoot);
    console.log("Found " + discovered.length + " exports");

    // Filter by category
    if (opts.category) {
        const cat = opts.category;
        discovered = discovered.filter(exp => deriveCategory(exp.importPath).id === cat);
        console.log("Filtered to " + cat + ": " + discovered.length + " exports");
    }

    if (opts.check) {
        printCheckReport(discovered);
        return;
    }

    // Step 2: Resolve source paths and group by category
    console.log("Resolving source paths...");
    const generated: Record<
        string,
        { label: string; description: string; entries: CatalogEntry[] }
    > = {};
    let resolved = 0;
    const errors: { className: string; error: string }[] = [];

    for (const exp of discovered) {
        try {
            const barrelPath = path.join(
                repoRoot,
                "packages/webiny/src",
                exp.importPath.replace(/^webiny\//, "") + ".ts"
            );
            const sourceFile = followReExport(project, barrelPath, exp.className);
            if (!sourceFile) {
                errors.push({ className: exp.className, error: "Could not resolve source file" });
                continue;
            }

            const sourceFilePath = getPackagePath(sourceFile, repoRoot);
            const description = getJsDoc(sourceFile, exp.className);
            // Prefer the flag set during discovery; fall back to deep AST check.
            const isType = exp.isType ?? isTypeExport(sourceFile, exp.className);
            const category = deriveCategory(exp.importPath);

            if (!generated[category.id]) {
                generated[category.id] = {
                    label: category.label,
                    description: category.description,
                    entries: []
                };
            }

            generated[category.id].entries.push({
                className: exp.className,
                importPath: exp.importPath,
                sourceFilePath,
                description,
                isType
            });

            resolved++;

            if (opts.verbose) {
                const desc = description ? " — " + description : "";
                console.log("  " + exp.className + " → " + sourceFilePath + desc);
            }
        } catch (e) {
            errors.push({ className: exp.className, error: String(e) });
            if (opts.verbose) {
                console.error("  ✗ " + exp.className + ": " + e);
            }
        }
    }

    // Step 3: Write SKILL.md per category
    const written: string[] = [];
    for (const [categoryId, data] of Object.entries(generated)) {
        data.entries.sort((a, b) => a.className.localeCompare(b.className));

        // "api/cms" → "generated/api/cms", "infra" → "generated/infra"
        const skillDir = path.join(outputDir, "generated", categoryId);
        fs.mkdirSync(skillDir, { recursive: true });

        const howToUse = getHowToUse(categoryId);
        const md = renderCatalog(
            categoryId,
            data.label,
            data.description,
            data.entries,
            format,
            howToUse
        );
        fs.writeFileSync(path.join(skillDir, "SKILL.md"), md, "utf-8");

        const relDir = `generated/${categoryId}`;
        written.push(relDir);

        if (opts.verbose) {
            console.log("  Wrote " + relDir + "/SKILL.md (" + data.entries.length + " entries)");
        }
    }

    // Summary
    console.log("");
    console.log("=== Summary ===");
    console.log("Resolved: " + resolved + " abstractions");
    console.log("Catalogs: " + written.length + " SKILL.md files (format: " + format + ")");
    for (const d of written.sort()) {
        console.log("  " + d + "/SKILL.md");
    }
    if (errors.length > 0) {
        console.log("Errors: " + errors.length);
        for (const err of errors) {
            console.log("  - " + err.className + ": " + err.error);
        }
    }
    console.log("Output: " + outputDir);
}

function renderCatalog(
    categoryId: string,
    label: string,
    description: string,
    entries: CatalogEntry[],
    format: "table" | "cards",
    howToUse: string[]
): string {
    const skillName = "webiny-" + categoryId.replace(/\//g, "-") + "-catalog";
    const lines: string[] = [];

    // Front-matter
    lines.push("---");
    lines.push(`name: ${skillName}`);
    lines.push("context: webiny-api");
    lines.push("description: >");
    lines.push(`  ${label} — ${entries.length} abstractions.`);
    if (description) {
        lines.push(`  ${description}`);
    }
    lines.push("---");
    lines.push("");

    // Header
    lines.push(`# ${label}`);
    lines.push("");
    if (description) {
        lines.push(description);
        lines.push("");
    }

    if (howToUse.length > 0) {
        lines.push("## How to Use");
        lines.push("");
        howToUse.forEach((item, i) => {
            lines.push(`${i + 1}. ${item}`);
        });
    }
    lines.push("");
    lines.push("## Abstractions");
    lines.push("");

    if (format === "table") {
        renderTable(lines, entries);
    } else {
        renderCards(lines, entries);
    }

    lines.push("");
    return lines.join("\n");
}

function renderTable(lines: string[], entries: CatalogEntry[]): void {
    lines.push("| Name | Kind | Import | Source | Description |");
    lines.push("|------|------|--------|--------|-------------|");
    for (const e of entries) {
        const desc = e.description || "";
        const kind = e.isType ? "type" : "value";
        const importKw = e.isType ? "import type" : "import";
        lines.push(
            `| \`${e.className}\` | ${kind} | \`${importKw} { ${e.className} } from "${e.importPath}"\` | \`${e.sourceFilePath}\` | ${desc} |`
        );
    }
}

function renderCards(lines: string[], entries: CatalogEntry[]): void {
    for (const e of entries) {
        lines.push("---");
        lines.push(`**Name:** \`${e.className}\``);
        if (e.isType) {
            lines.push(`**Kind:** type`);
            lines.push(`**Import:** \`import type { ${e.className} } from "${e.importPath}"\``);
        } else {
            lines.push(`**Import:** \`import { ${e.className} } from "${e.importPath}"\``);
        }
        lines.push(`**Source:** \`${e.sourceFilePath}\``);
        if (e.description) {
            lines.push(`**Description:** ${e.description}`);
        }
        lines.push("");
    }
    // Close the last card
    lines.push("---");
}

function printCheckReport(discovered: { className: string; importPath: string }[]): void {
    console.log("");
    console.log("=== Check Report ===");
    console.log("Total discovered exports: " + discovered.length);
    console.log("");
    for (const exp of discovered) {
        console.log("  " + exp.className + " → " + exp.importPath);
    }
}
