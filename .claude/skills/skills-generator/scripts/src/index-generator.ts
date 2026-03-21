/**
 * Index generator — builds skill-index.json from all skill manifests.
 */
import fs from "fs";
import path from "path";

/**
 * Recursively find all skill.manifest.json files under a directory.
 */
function findManifests(dir) {
  var results = [];
  if (!fs.existsSync(dir)) return results;

  var entries = fs.readdirSync(dir, { withFileTypes: true });
  for (var entry of entries) {
    var fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findManifests(fullPath));
    } else if (entry.name === "skill.manifest.json") {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Read a SKILL.md file and extract the frontmatter description.
 */
function extractDescription(skillDir) {
  var skillMdPath = path.join(skillDir, "SKILL.md");
  if (!fs.existsSync(skillMdPath)) return "";

  var content = fs.readFileSync(skillMdPath, "utf-8");
  // Look for description in frontmatter
  var match = content.match(/description:\s*>\s*\n\s+(.+)/);
  if (match) return match[1].trim();

  // Fallback: first non-frontmatter, non-heading paragraph
  var lines = content.split("\n");
  var inFrontmatter = false;
  for (var line of lines) {
    if (line.trim() === "---") {
      inFrontmatter = !inFrontmatter;
      continue;
    }
    if (inFrontmatter) continue;
    if (line.startsWith("#")) continue;
    if (line.trim().length > 0) return line.trim();
  }
  return "";
}

/**
 * Build and write the skill-index.json file.
 */
export function rebuildIndex(outputDir) {
  var manifestPaths = findManifests(outputDir);
  var categories = {};

  for (var manifestPath of manifestPaths) {
    var manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    var skillDir = path.dirname(manifestPath);

    // Derive category from the directory structure
    var relPath = path.relative(outputDir, skillDir);
    var pathParts = relPath.split(path.sep);

    // Category is everything except the last segment (skill name)
    var categoryId = pathParts.slice(0, -1).join("/");
    var skillName = manifest.skill;

    if (!categories[categoryId]) {
      categories[categoryId] = {
        id: categoryId,
        label: categoryId,
        description: "",
        entities: {}
      };
    }

    // Derive entity from the skill name (strip layer prefix, get first word)
    var entityName = deriveEntityFromSkillData(manifest, categoryId);

    if (!categories[categoryId].entities[entityName]) {
      categories[categoryId].entities[entityName] = [];
    }

    var description = extractDescription(skillDir);

    categories[categoryId].entities[entityName].push({
      name: skillName,
      type: manifest.abstractionType || "unknown",
      description: description
    });
  }

  // Convert to the index format
  var index = {
    generatedAt: new Date().toISOString(),
    categories: Object.values(categories).map(function(cat) {
      return {
        id: cat.id,
        label: cat.label,
        description: cat.description,
        entities: Object.keys(cat.entities).map(function(entityName) {
          return {
            name: entityName,
            skills: cat.entities[entityName]
          };
        })
      };
    })
  };

  var indexPath = path.join(outputDir, "skill-index.json");
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n", "utf-8");

  return indexPath;
}

/**
 * Derive entity name from manifest data.
 */
function deriveEntityFromSkillData(manifest, categoryId) {
  var className = manifest.className || "";

  // For EventHandlers: strip suffix, take entity portion
  if (className.endsWith("EventHandler")) {
    var base = className.replace(/EventHandler$/, "");
    // Find Before/After to extract entity
    var beforeIdx = base.indexOf("Before");
    var afterIdx = base.indexOf("After");
    var idx = beforeIdx > 0 ? beforeIdx : afterIdx > 0 ? afterIdx : -1;
    if (idx > 0) {
      return base.slice(0, idx);
    }
    // No timing — use first word(s)
    var words = base.replace(/([a-z])([A-Z])/g, "$1\0$2").split("\0");
    if (words.length >= 2) {
      return words.slice(0, -1).join("");
    }
    return base;
  }

  // For UseCases: strip prefix verb and suffix
  if (className.endsWith("UseCase")) {
    var base2 = className.replace(/UseCase$/, "");
    var verbs = [
      "Create",
      "Delete",
      "Update",
      "Get",
      "List",
      "Publish",
      "Unpublish",
      "Republish",
      "Move",
      "Restore",
      "Validate",
      "Duplicate",
      "Install",
      "Schedule"
    ];
    for (var verb of verbs) {
      if (base2.startsWith(verb)) {
        return base2.slice(verb.length) || verb;
      }
    }
    return base2;
  }

  return "Other";
}
