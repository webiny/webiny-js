#!/usr/bin/env npx tsx
/**
 * CLI entry point — generates per-category SKILL.md catalogs of all exported abstractions.
 */
import { run } from "./pipeline.js";
import type { CliOptions } from "./types.js";

function parseArgs(argv: string[]): CliOptions {
    const opts: CliOptions = {};
    const args = argv.slice(2);
    let i = 0;

    while (i < args.length) {
        const arg = args[i];
        if (arg === "--check") {
            opts.check = true;
            i++;
        } else if (arg === "--output" && i + 1 < args.length) {
            opts.output = args[i + 1];
            i += 2;
        } else if ((arg === "--category" || arg === "-c") && i + 1 < args.length) {
            opts.category = args[i + 1];
            i += 2;
        } else if (arg === "--verbose" || arg === "-v") {
            opts.verbose = true;
            i++;
        } else if (arg === "--repo-root" && i + 1 < args.length) {
            opts.repoRoot = args[i + 1];
            i += 2;
        } else if (arg === "--help" || arg === "-h") {
            printHelp();
            process.exit(0);
        } else {
            console.error("Unknown argument: " + arg);
            printHelp();
            process.exit(1);
        }
    }

    return opts;
}

function printHelp(): void {
    console.log("Usage: npx tsx scripts/generateSkills/src/bin.ts [options]");
    console.log("");
    console.log("Generates per-category SKILL.md catalogs listing all exported abstractions");
    console.log("with resolved source file paths for on-demand LLM type resolution.");
    console.log("");
    console.log("Options:");
    console.log("  --category, -c <id>  Only process a specific category (e.g., api/tenancy)");
    console.log("  --check              Report only, don't write files");
    console.log("  --output <path>      Output directory (default: skills/user-skills)");
    console.log("  --repo-root <path>   Repository root (default: cwd)");
    console.log("  --verbose, -v        Verbose output");
    console.log("  --help, -h           Show this help");
}

const opts = parseArgs(process.argv);
run(opts);
