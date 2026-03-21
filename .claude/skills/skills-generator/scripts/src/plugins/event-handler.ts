/**
 * EventHandler plugin — discovers and processes *EventHandler exports.
 */
import { toKebabCase, pascalToTitleCase } from "../name-utils.js";
import {
  buildEventHandlerDescription,
  buildFiresWhen,
  getNotes,
  REGISTRATION_SNIPPETS
} from "../config.js";

const TIMING_WORDS = ["Before", "After"];

/**
 * Parse an EventHandler class name into entity, timing, and operation.
 *
 * Patterns:
 *   EntryBeforeCreateEventHandler → entity=Entry, timing=before, operation=create
 *   EntryRevisionBeforeCreateEventHandler → entity=EntryRevision, timing=before, operation=create
 *   BeforeAuthenticationEventHandler → entity=Authentication, timing=before, operation=authentication
 *   SystemInstalledEventHandler → entity=System, timing=undefined, operation=installed
 */
function parseEventHandlerName(className) {
  const base = className.replace(/EventHandler$/, "");

  // Case 1: Starts with Before/After (e.g., BeforeAuthentication)
  for (const word of TIMING_WORDS) {
    if (base.startsWith(word)) {
      const rest = base.slice(word.length);
      return {
        entity: rest,
        timing: word.toLowerCase(),
        operation: rest.toLowerCase()
      };
    }
  }

  // Case 2: Contains Before/After somewhere in the middle
  for (const word of TIMING_WORDS) {
    const idx = base.indexOf(word);
    if (idx > 0) {
      const entity = base.slice(0, idx);
      const operation = base.slice(idx + word.length);
      return {
        entity,
        timing: word.toLowerCase(),
        operation: toKebabCase(operation)
      };
    }
  }

  // Case 3: No timing (e.g., SystemInstalled, TenantInstalled)
  // Try to split: last word is the operation, rest is entity
  const words = base
    .replace(/([a-z])([A-Z])/g, "$1\0$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1\0$2")
    .split("\0");

  if (words.length >= 2) {
    const entity = words.slice(0, -1).join("");
    const operation = words[words.length - 1].toLowerCase();
    return { entity, timing: undefined, operation };
  }

  return { entity: base, timing: undefined, operation: base.toLowerCase() };
}

export const eventHandlerPlugin = {
  id: "event-handler",
  label: "EventHandler",
  exportPathPatterns: ["./api/**"],

  matches(exportName) {
    return exportName.endsWith("EventHandler");
  },

  parseName(className, importPath, layer) {
    const parsed = parseEventHandlerName(className);

    // Build skill name with layer prefix
    const parts = [layer];
    parts.push(toKebabCase(parsed.entity));
    if (parsed.timing) {
      parts.push(parsed.timing);
    }
    parts.push(parsed.operation);
    const skillName = parts.join("-");

    // Human name without layer prefix
    const humanParts = [pascalToTitleCase(parsed.entity)];
    if (parsed.timing) {
      humanParts.push(
        parsed.timing.charAt(0).toUpperCase() + parsed.timing.slice(1)
      );
    }
    humanParts.push(
      parsed.operation.charAt(0).toUpperCase() + parsed.operation.slice(1)
    );
    const humanName = humanParts.join(" ");

    return {
      entity: parsed.entity,
      timing: parsed.timing,
      operation: parsed.operation,
      skillName,
      humanName
    };
  },

  extractTypes(className, sourceFile, project, utils) {
    const sourceInfo = utils.getSourceInfo(sourceFile);

    // Find the namespace
    const nsTypes = utils.extractNamespaceTypes(sourceFile, className, [
      "Interface",
      "Event"
    ]);

    // Try to resolve the event payload
    let payloadText = "";
    const eventTypeName = nsTypes["Event"];
    if (eventTypeName) {
      // The Event type points to a class name — resolve its payload
      payloadText = utils.resolveEventPayload(sourceFile, eventTypeName);
    }

    // Build the type block
    const lines = [];
    lines.push("// " + className + ".Interface");
    if (nsTypes["Interface"]) {
      lines.push("interface Interface {");
      lines.push("  handle(event: Event): Promise<void>;");
      lines.push("}");
    }
    lines.push("");
    lines.push("// " + className + ".Event");
    if (payloadText && payloadText !== "unknown") {
      lines.push("// Event payload:");
      lines.push(payloadText);
    } else if (nsTypes["Event"]) {
      lines.push("type Event = " + nsTypes["Event"] + ";");
    }
    lines.push("");
    lines.push("// " + className + ".createImplementation");
    lines.push("function createImplementation(params: {");
    lines.push("  implementation: new (...args: any[]) => Interface;");
    lines.push("  dependencies: any[];");
    lines.push("}): any;");

    const typeBlock = lines.join("\n");
    const typeHash = utils.computeHash(typeBlock);

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

  templateName: "event-handler-skill.md.hbs",

  computeTemplateData(parsed, types, importPath, layer) {
    const fileName =
      toKebabCase(parsed.entity) +
      "-" +
      (parsed.timing || "") +
      "-" +
      parsed.operation;
    const registrationTemplate =
      REGISTRATION_SNIPPETS[layer] || REGISTRATION_SNIPPETS["api"];
    const registrationSnippet = registrationTemplate.replace(
      "${fileName}",
      fileName
    );

    // Compute related skills
    const relatedSkills = [];

    // Opposite timing
    if (parsed.timing === "before") {
      const afterSkill = parsed.skillName.replace("-before-", "-after-");
      relatedSkills.push({
        name: afterSkill,
        reason:
          "react after " + parsed.entity.toLowerCase() + " " + parsed.operation
      });
    } else if (parsed.timing === "after") {
      const beforeSkill = parsed.skillName.replace("-after-", "-before-");
      relatedSkills.push({
        name: beforeSkill,
        reason:
          "intercept before " +
          parsed.entity.toLowerCase() +
          " " +
          parsed.operation
      });
    }

    // Always link to dependency-injection
    relatedSkills.push({
      name: "dependency-injection",
      reason: "inject Logger, BuildParams, and other services"
    });

    return {
      firesWhen: buildFiresWhen(parsed.timing, parsed.operation, parsed.entity),
      timing: parsed.timing || "none",
      registrationSnippet,
      notes: getNotes("EventHandler", parsed.timing, parsed.entity),
      relatedSkills,
      exampleCode:
        "<!-- TODO: Generate a realistic example for this handler -->",
      description: buildEventHandlerDescription(
        parsed.timing,
        parsed.operation,
        parsed.entity
      )
    };
  }
};
