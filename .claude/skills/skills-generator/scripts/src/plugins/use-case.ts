/**
 * UseCase plugin — discovers and processes *UseCase exports.
 */
import { toKebabCase, pascalToTitleCase } from "../name-utils.js";
import {
  buildUseCaseDescription,
  getNotes,
  REGISTRATION_SNIPPETS
} from "../config.js";

const KNOWN_VERBS = [
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

/**
 * Parse a UseCase class name into operation and entity.
 *
 * Patterns:
 *   CreateEntryUseCase → operation=create, entity=Entry
 *   MoveEntryToBinUseCase → operation=move-entry-to-bin, entity=Entry (complex)
 *   GetLatestRevisionByEntryIdUseCase → operation=get, entity=LatestRevisionByEntryId
 *   ListLatestEntriesUseCase → operation=list, entity=LatestEntries
 *   InstallSystemUseCase → operation=install, entity=System
 */
function parseUseCaseName(className) {
  const base = className.replace(/UseCase$/, "");

  // Try to match a known verb at the start
  for (const verb of KNOWN_VERBS) {
    if (base.startsWith(verb)) {
      const rest = base.slice(verb.length);
      return {
        operation: verb.toLowerCase(),
        entity: rest || verb
      };
    }
  }

  // Fallback: treat the whole thing as the operation
  return {
    operation: toKebabCase(base),
    entity: base
  };
}

export const useCasePlugin = {
  id: "use-case",
  label: "UseCase",
  exportPathPatterns: ["./api/**"],

  matches(exportName) {
    return exportName.endsWith("UseCase");
  },

  parseName(className, importPath, layer) {
    const parsed = parseUseCaseName(className);

    // Build skill name with layer prefix
    const skillName =
      layer + "-" + toKebabCase(parsed.operation + parsed.entity);

    // Human name
    const humanName = pascalToTitleCase(
      parsed.operation.charAt(0).toUpperCase() +
        parsed.operation.slice(1) +
        parsed.entity
    );

    return {
      entity: parsed.entity,
      timing: undefined,
      operation: parsed.operation,
      skillName,
      humanName
    };
  },

  extractTypes(className, sourceFile, project, utils) {
    var sourceInfo = utils.getSourceInfo(sourceFile);

    // Find the namespace and extract members
    var nsTypes = utils.extractNamespaceTypes(sourceFile, className, [
      "Interface",
      "Input",
      "Error",
      "Return",
      "Options"
    ]);

    // Build the type block
    var lines = [];
    lines.push("// " + className + ".Interface");
    if (nsTypes["Interface"]) {
      lines.push("type Interface = " + nsTypes["Interface"] + ";");
    }

    if (nsTypes["Input"]) {
      lines.push("");
      lines.push("// " + className + ".Input");
      lines.push("type Input = " + nsTypes["Input"] + ";");
    }

    if (nsTypes["Options"]) {
      lines.push("");
      lines.push("// " + className + ".Options");
      lines.push("type Options = " + nsTypes["Options"] + ";");
    }

    if (nsTypes["Error"]) {
      lines.push("");
      lines.push("// " + className + ".Error");
      lines.push("type Error = " + nsTypes["Error"] + ";");
    }

    if (nsTypes["Return"]) {
      lines.push("");
      lines.push("// " + className + ".Return");
      lines.push("type Return = " + nsTypes["Return"] + ";");
    }

    lines.push("");
    lines.push("// " + className + ".createImplementation");
    lines.push("function createImplementation(params: {");
    lines.push("  implementation: new (...args: any[]) => Interface;");
    lines.push("  dependencies: any[];");
    lines.push("}): any;");

    var typeBlock = lines.join("\n");
    var typeHash = utils.computeHash(typeBlock);

    return {
      typeBlock,
      typeHash,
      sourceFiles: [
        {
          package: sourceInfo.package,
          files: [sourceInfo.file]
        }
      ]
    };
  },

  templateName: "use-case-skill.md.hbs",

  computeTemplateData(parsed, types, importPath, layer) {
    var fileName = toKebabCase(parsed.operation + "-" + parsed.entity);
    var registrationTemplate =
      REGISTRATION_SNIPPETS[layer] || REGISTRATION_SNIPPETS["api"];
    var registrationSnippet = registrationTemplate.replace(
      "${fileName}",
      fileName
    );

    var relatedSkills = [];

    // Link to dependency-injection
    relatedSkills.push({
      name: "dependency-injection",
      reason: "inject Logger, BuildParams, and other services"
    });

    return {
      registrationSnippet,
      notes: getNotes("UseCase", undefined, parsed.entity),
      relatedSkills,
      exampleCode:
        "<!-- TODO: Generate a realistic example for this use case -->",
      description: buildUseCaseDescription(parsed.operation, parsed.entity)
    };
  }
};
