#!/usr/bin/env npx tsx
/**
 * CLI entry point for the skill generation pipeline.
 *
 * Usage:
 *   npx tsx generate-skills.ts                           # Full regeneration
 *   npx tsx generate-skills.ts --check                   # Report only
 *   npx tsx generate-skills.ts --since <ref>             # Changed since ref
 *   npx tsx generate-skills.ts --output path/to/skills   # Custom output dir
 *   npx tsx generate-skills.ts --plugin event-handler    # Only run one plugin
 *   npx tsx generate-skills.ts --verbose                 # Verbose output
 */
import { run } from "./src/pipeline.js";

function parseArgs(argv) {
  var opts = {
    since: undefined,
    check: false,
    output: undefined,
    plugin: undefined,
    verbose: false,
    repoRoot: undefined
  };

  var args = argv.slice(2);
  var i = 0;
  while (i < args.length) {
    var arg = args[i];
    if (arg === "--since" && i + 1 < args.length) {
      opts.since = args[i + 1];
      i += 2;
    } else if (arg === "--check") {
      opts.check = true;
      i++;
    } else if (arg === "--output" && i + 1 < args.length) {
      opts.output = args[i + 1];
      i += 2;
    } else if (arg === "--plugin" && i + 1 < args.length) {
      opts.plugin = args[i + 1];
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

function printHelp() {
  console.log("Usage: npx tsx generate-skills.ts [options]");
  console.log("");
  console.log("Options:");
  console.log(
    "  --since <ref>        Only regenerate skills changed since git ref"
  );
  console.log("  --check              Report only, don't write files");
  console.log(
    "  --output <path>      Output directory (default: skills/user-skills)"
  );
  console.log("  --plugin <id>        Only run a specific plugin");
  console.log("  --repo-root <path>   Repository root (default: cwd)");
  console.log("  --verbose, -v        Verbose output");
  console.log("  --help, -h           Show this help");
}

var opts = parseArgs(process.argv);
run(opts);
