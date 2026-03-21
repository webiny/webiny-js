/**
 * Pipeline — discovers all exported abstractions and emits per-category SKILL.md catalogs.
 */
import fs from "fs";
import path from "path";
import { discover } from "./discovery.js";
import { createProject, followReExport, getPackagePath } from "./source-resolver.js";
import { deriveCategory } from "./config.js";
import type { CliOptions, CatalogEntry } from "./types.js";

export function run(opts: CliOptions): void {
    const repoRoot = opts.repoRoot || process.cwd();
    const outputDir = path.resolve(repoRoot, opts.output || "skills/user-skills");

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
    const catalogs: Record<
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
            const category = deriveCategory(exp.importPath);

            if (!catalogs[category.id]) {
                catalogs[category.id] = {
                    label: category.label,
                    description: category.description,
                    entries: []
                };
            }

            catalogs[category.id].entries.push({
                className: exp.className,
                importPath: exp.importPath,
                sourceFilePath
            });

            resolved++;

            if (opts.verbose) {
                console.log("  " + exp.className + " → " + sourceFilePath);
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
    for (const [categoryId, data] of Object.entries(catalogs)) {
        data.entries.sort((a, b) => a.className.localeCompare(b.className));

        const skillDir = path.join(outputDir, categoryId, "catalog");
        fs.mkdirSync(skillDir, { recursive: true });

        const md = renderCatalog(categoryId, data.label, data.description, data.entries);
        fs.writeFileSync(path.join(skillDir, "SKILL.md"), md, "utf-8");

        const relDir = categoryId + "/catalog";
        written.push(relDir);

        if (opts.verbose) {
            console.log("  Wrote " + relDir + "/SKILL.md (" + data.entries.length + " entries)");
        }
    }

    // Summary
    console.log("");
    console.log("=== Summary ===");
    console.log("Resolved: " + resolved + " abstractions");
    console.log("Catalogs: " + written.length + " SKILL.md files");
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
    entries: CatalogEntry[]
): string {
    const skillName = "webiny-" + categoryId.replace(/\//g, "-") + "-catalog";
    const lines: string[] = [];

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
    lines.push(`# ${label}`);
    lines.push("");
    if (description) {
        lines.push(description);
        lines.push("");
    }
    lines.push("## How to Use");
    lines.push("");
    lines.push("1. Find the abstraction you need in the table below");
    lines.push("2. Read the source file to get the exact interface and types");
    lines.push('3. Import: `import { ClassName } from "<importPath>";`');
    lines.push(
        "4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns"
    );
    lines.push("");
    lines.push("## Abstractions");
    lines.push("");
    lines.push("| Class | Import | Source |");
    lines.push("|-------|--------|--------|");

    for (const e of entries) {
        lines.push(`| \`${e.className}\` | \`${e.importPath}\` | \`${e.sourceFilePath}\` |`);
    }

    lines.push("");
    return lines.join("\n");
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
