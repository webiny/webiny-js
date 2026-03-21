/**
 * Manifest generator — writes skill.manifest.json for each generated skill.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

var _gitRef = null;

/**
 * Get the current git HEAD ref (cached).
 */
function getGitRef(repoRoot) {
  if (_gitRef) return _gitRef;
  try {
    _gitRef = execSync("git rev-parse HEAD", {
      cwd: repoRoot,
      encoding: "utf-8"
    }).trim();
  } catch (e) {
    _gitRef = "unknown";
  }
  return _gitRef;
}

/**
 * Write a skill.manifest.json file for a generated skill.
 */
export function writeManifest(skillData, outputDir, repoRoot) {
  var manifest = {
    skill: skillData.skillName,
    generated: true,
    generatedAt: new Date().toISOString(),
    generatedFromRef: getGitRef(repoRoot),
    abstractionType: skillData.pluginId,
    className: skillData.className,
    importPath: skillData.importPath,
    sources: skillData.sourceFiles,
    typeHash: skillData.typeHash
  };

  var skillDir = path.join(outputDir, skillData.category, skillData.skillName);
  fs.mkdirSync(skillDir, { recursive: true });

  var manifestPath = path.join(skillDir, "skill.manifest.json");
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(manifest, null, 2) + "\n",
    "utf-8"
  );

  return manifestPath;
}
