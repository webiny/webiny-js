/**
 * Change detector — compares current type hashes against existing manifests.
 * Detects new, changed, and removed skills.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * Recursively find all skill.manifest.json files.
 */
function findManifests(dir) {
  var results = {};
  if (!fs.existsSync(dir)) return results;

  var entries = fs.readdirSync(dir, { withFileTypes: true });
  for (var entry of entries) {
    var fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(results, findManifests(fullPath));
    } else if (entry.name === "skill.manifest.json") {
      try {
        var manifest = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        if (manifest.generated && manifest.skill) {
          results[manifest.skill] = manifest;
        }
      } catch (e) {
        // Skip invalid manifests
      }
    }
  }
  return results;
}

/**
 * Get files changed since a git ref.
 */
function getChangedFiles(repoRoot, sinceRef) {
  try {
    var output = execSync(
      "git diff --name-only " + sinceRef + "..HEAD -- packages/",
      { cwd: repoRoot, encoding: "utf-8" }
    );
    return output
      .trim()
      .split("\n")
      .filter(function(line) {
        return line.length > 0;
      });
  } catch (e) {
    console.error("Warning: git diff failed for ref " + sinceRef);
    return [];
  }
}

/**
 * Extract package name from a file path like "packages/api-headless-cms/src/..."
 */
function extractPackageName(filePath) {
  var match = filePath.match(/^packages\/([^/]+)\//);
  if (match) return "@webiny/" + match[1];
  return null;
}

/**
 * Detect changes between discovered exports and existing manifests.
 */
export function detectChanges(discovered, outputDir, sinceRef, repoRoot) {
  var existingManifests = findManifests(outputDir);
  var existingSkillNames = new Set(Object.keys(existingManifests));
  var discoveredSkillNames = new Set();

  // If --since is provided, get changed packages to narrow scope
  var changedPackages = null;
  if (sinceRef) {
    var changedFiles = getChangedFiles(repoRoot, sinceRef);
    changedPackages = new Set();
    for (var file of changedFiles) {
      var pkg = extractPackageName(file);
      if (pkg) changedPackages.add(pkg);
    }
  }

  var added = [];
  var changed = [];
  var unchanged = [];

  for (var exp of discovered) {
    discoveredSkillNames.add(exp.skillName);

    var existing = existingManifests[exp.skillName];

    if (!existing) {
      added.push(exp);
      continue;
    }

    // If --since, check if the source package changed
    if (changedPackages) {
      var sourcePackages = (existing.sources || []).map(function(s) {
        return s.package;
      });
      var anyChanged = sourcePackages.some(function(pkg) {
        return changedPackages.has(pkg);
      });
      if (!anyChanged) {
        unchanged.push(exp);
        continue;
      }
    }

    // Will be marked as changed or unchanged after type extraction
    // For now, mark all as potentially changed
    changed.push(exp);
  }

  // Find removed skills
  var removed = [];
  existingSkillNames.forEach(function(name) {
    if (!discoveredSkillNames.has(name)) {
      removed.push(name);
    }
  });

  return {
    added: added,
    changed: changed,
    removed: removed,
    unchanged: unchanged
  };
}

/**
 * After type extraction, compare hashes to determine which "changed" entries actually changed.
 */
export function filterByHash(changeReport, skillDataMap, outputDir) {
  var existingManifests = findManifests(outputDir);
  var actuallyChanged = [];
  var actuallyUnchanged = [];

  for (var exp of changeReport.changed) {
    var skillData = skillDataMap[exp.className];
    var existing = existingManifests[exp.skillName];

    if (skillData && existing && skillData.typeHash === existing.typeHash) {
      actuallyUnchanged.push(exp);
    } else {
      actuallyChanged.push(exp);
    }
  }

  return {
    added: changeReport.added,
    changed: actuallyChanged,
    removed: changeReport.removed,
    unchanged: changeReport.unchanged.concat(actuallyUnchanged)
  };
}
