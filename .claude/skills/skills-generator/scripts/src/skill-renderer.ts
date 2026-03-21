/**
 * Skill renderer — loads Handlebars templates and renders SKILL.md files.
 */
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

var templateCache = {};

/**
 * Load and cache a Handlebars template.
 */
function loadTemplate(templatesDir, templateName) {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }
  var templatePath = path.join(templatesDir, templateName);
  var templateSource = fs.readFileSync(templatePath, "utf-8");
  var compiled = Handlebars.compile(templateSource);
  templateCache[templateName] = compiled;
  return compiled;
}

/**
 * Render a skill's SKILL.md and write it to the output directory.
 */
export function renderSkill(skillData, templateName, outputDir, templatesDir) {
  var template = loadTemplate(templatesDir, templateName);

  // Merge base skill data with plugin-specific template data
  var templateData = Object.assign({}, skillData, skillData.templateData);

  var content = template(templateData);

  // Output path: {outputDir}/{category}/{skillName}/SKILL.md
  // category is like "api/cms" — use as nested path
  var skillDir = path.join(outputDir, skillData.category, skillData.skillName);
  fs.mkdirSync(skillDir, { recursive: true });

  var skillPath = path.join(skillDir, "SKILL.md");
  fs.writeFileSync(skillPath, content, "utf-8");

  return skillPath;
}
