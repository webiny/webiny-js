/**
 * Pipeline orchestrator — runs the full skill generation pipeline.
 */
import path from "path";
import { plugins as allPlugins } from "./plugins/index.js";
import { discover } from "./discovery.js";
import {
  createProject,
  createTypeUtils,
  followReExport
} from "./type-utils.js";
import { deriveCategory } from "./config.js";
import { renderSkill } from "./skill-renderer.js";
import { writeManifest } from "./manifest-generator.js";
import { rebuildIndex } from "./index-generator.js";
import { detectChanges, filterByHash } from "./change-detector.js";

/**
 * Run the full pipeline.
 */
export function run(opts) {
  var repoRoot = opts.repoRoot || process.cwd();
  var outputDir = path.resolve(repoRoot, opts.output || "skills/user-skills");
  var templatesDir = path.resolve(
    repoRoot,
    ".claude/skills/skills-generator/templates"
  );

  console.log("Initializing ts-morph project...");
  var project = createProject(repoRoot);
  var typeUtils = createTypeUtils();

  // Filter plugins if --plugin flag is used
  var activePlugins = allPlugins;
  if (opts.plugin) {
    activePlugins = allPlugins.filter(function(p) {
      return p.id === opts.plugin;
    });
    if (activePlugins.length === 0) {
      console.error("Unknown plugin: " + opts.plugin);
      console.error(
        "Available: " +
          allPlugins
            .map(function(p) {
              return p.id;
            })
            .join(", ")
      );
      process.exit(1);
    }
  }

  // Step 1: Discovery
  console.log("Discovering exports...");
  var discovered = discover(project, activePlugins, repoRoot);
  console.log("Found " + discovered.length + " exports");

  // Assign skill names for change detection
  for (var exp of discovered) {
    var plugin = activePlugins.find(function(p) {
      return p.id === exp.pluginId;
    });
    if (plugin) {
      var parsed = plugin.parseName(exp.className, exp.importPath, exp.layer);
      exp.skillName = parsed.skillName;
    }
  }

  // Step 2: Change detection
  var toProcess = discovered;
  if (opts.since) {
    console.log("Detecting changes since " + opts.since + "...");
    var changes = detectChanges(discovered, outputDir, opts.since, repoRoot);
    toProcess = changes.added.concat(changes.changed);
    console.log(
      "  " +
        changes.added.length +
        " new, " +
        changes.changed.length +
        " potentially changed, " +
        changes.removed.length +
        " removed, " +
        changes.unchanged.length +
        " unchanged"
    );

    if (changes.removed.length > 0) {
      console.log("  Removed skills (manual cleanup needed):");
      for (var name of changes.removed) {
        console.log("    - " + name);
      }
    }
  }

  if (opts.check) {
    printCheckReport(discovered, toProcess, opts.since);
    return;
  }

  // Step 3: Process each export
  console.log("Processing " + toProcess.length + " skills...");
  var processed = 0;
  var errors = [];

  for (var exp2 of toProcess) {
    var plugin2 = activePlugins.find(function(p) {
      return p.id === exp2.pluginId;
    });
    if (!plugin2) continue;

    try {
      var parsed2 = plugin2.parseName(
        exp2.className,
        exp2.importPath,
        exp2.layer
      );

      // Follow re-export to actual source file
      var barrelPath = path.join(
        repoRoot,
        "packages/webiny/src",
        exp2.importPath.replace(/^webiny\//, "") + ".ts"
      );
      var sourceFile = followReExport(project, barrelPath, exp2.className);
      if (!sourceFile) {
        errors.push({
          className: exp2.className,
          error: "Could not resolve source file"
        });
        continue;
      }

      // Extract types
      var types = plugin2.extractTypes(
        exp2.className,
        sourceFile,
        project,
        typeUtils
      );

      // Derive category
      var category = deriveCategory(exp2.importPath);

      // Compute plugin-specific template data
      var templateData = plugin2.computeTemplateData(
        parsed2,
        types,
        exp2.importPath,
        exp2.layer
      );

      // Assemble skill data
      var skillData = {
        className: exp2.className,
        importPath: exp2.importPath,
        pluginId: exp2.pluginId,
        layer: exp2.layer,
        skillName: parsed2.skillName,
        humanName: parsed2.humanName,
        entity: parsed2.entity,
        timing: parsed2.timing,
        operation: parsed2.operation,
        typeBlock: types.typeBlock,
        typeHash: types.typeHash,
        sourceFiles: types.sourceFiles,
        category: category.id,
        categoryLabel: category.label,
        description: (templateData && templateData.description) || "",
        templateData: templateData
      };

      // Render and write
      renderSkill(skillData, plugin2.templateName, outputDir, templatesDir);
      writeManifest(skillData, outputDir, repoRoot);
      processed++;

      if (opts.verbose) {
        console.log("  ✓ " + parsed2.skillName + " (" + exp2.className + ")");
      }
    } catch (e) {
      errors.push({ className: exp2.className, error: String(e) });
      if (opts.verbose) {
        console.error("  ✗ " + exp2.className + ": " + e);
      }
    }
  }

  // Step 4: Rebuild index
  console.log("Rebuilding index...");
  rebuildIndex(outputDir);

  // Step 5: Summary
  console.log("");
  console.log("=== Summary ===");
  console.log("Processed: " + processed + " skills");
  if (errors.length > 0) {
    console.log("Errors: " + errors.length);
    for (var err of errors) {
      console.log("  - " + err.className + ": " + err.error);
    }
  }
  console.log("Output: " + outputDir);
}

function printCheckReport(allDiscovered, toProcess, sinceRef) {
  console.log("");
  console.log("=== Check Report ===");
  console.log("Total discovered exports: " + allDiscovered.length);
  if (sinceRef) {
    console.log("Changed since " + sinceRef + ": " + toProcess.length);
  }
  console.log("");

  // Group by plugin
  var byPlugin = {};
  for (var exp of allDiscovered) {
    if (!byPlugin[exp.pluginId]) {
      byPlugin[exp.pluginId] = [];
    }
    byPlugin[exp.pluginId].push(exp);
  }

  for (var pluginId of Object.keys(byPlugin)) {
    var items = byPlugin[pluginId];
    console.log(pluginId + " (" + items.length + " exports):");
    for (var item of items) {
      console.log("  " + item.className + " → " + item.importPath);
    }
    console.log("");
  }
}
