/*
 * Builds the guidance for writing Webiny admin extensions, for both places it is consumed.
 *
 * Run: yarn generate-extension-contracts   (or `yarn generate-skills`, which runs this too)
 * Requires `admin-ui` and `app-admin` to have been built, since it reads their emitted types.
 *
 * There are two audiences and one body of knowledge. A developer writing an extension in their
 * project gets it as an MCP skill; the admin assistant writing one from a prompt gets it as a tool
 * description. They differ only in execution environment: a developer imports freely and has a
 * compiler, the assistant has neither. So each kind is authored once in `skills/shared/extensions/`
 * with `@shared`, `@dev` and `@admin` sections, and this script renders the two targets.
 *
 * The type reference appended to both is read from the real declarations rather than written down.
 * The prose version of it was wrong three times in a row, and the correct answer was already in a
 * `.d.ts` every time.
 */
import { Project } from "ts-morph";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const fromRoot = (...parts) => join(ROOT, ...parts);

/* Each extension kind: where it is authored, and where the two renderings go. */
const KINDS = [
  {
    source: "skills/shared/extensions/field-renderer.md",
    skill: "skills/user-skills/admin/extensions/field-renderer/SKILL.md",
    contract: "packages/ai-powerups/src/api/features/AdminComponents/rendererContract.generated.ts",
    exportName: "RENDERER_CONTRACT",
    withTypeSurface: true
  },
  {
    source: "skills/shared/extensions/menu.md",
    skill: "skills/user-skills/admin/extensions/menu/SKILL.md",
    contract: "packages/ai-powerups/src/api/features/AdminComponents/menuContract.generated.ts",
    exportName: "MENU_CONTRACT",
    /* A menu is configuration, not a component. There is no component surface to describe. */
    withTypeSurface: false
  }
];

/* Types the component signatures refer to, so a callback parameter is not an opaque name. */
const SUPPORTING = ["NodeDto", "NodeFormattedDefaultData", "DropOptions"];

/* The view model every renderer is handed. */
const FIELD_TYPES = ["IFieldVM", "IFieldValidation", "IObjectFieldVM", "IObjectFieldItemVM"];

const MAX_TYPE_LEN = 110;

// ---------------------------------------------------------------------------
// Fragment parsing
// ---------------------------------------------------------------------------

/*
 * Splits an authored kind into its frontmatter and its three sections. Order in the file is the
 * order a human reads it; each target reorders as it needs, so `@admin` can lead the contract
 * (its constraints are the binding ones) while the skill never shows it at all.
 */
const parseKind = text => {
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) {
    throw new Error("Missing YAML frontmatter.");
  }

  const body = text.slice(fm[0].length);
  const sections = {};
  const parts = body.split(/<!--\s*@(\w+)\s*-->/);

  for (let i = 1; i < parts.length; i += 2) {
    sections[parts[i]] = parts[i + 1].trim();
  }

  for (const required of ["shared", "dev", "admin"]) {
    if (!sections[required]) {
      throw new Error(`Missing a @${required} section.`);
    }
  }

  return { frontmatter: fm[1], sections };
};

// ---------------------------------------------------------------------------
// Type surface
// ---------------------------------------------------------------------------

const project = new Project({
  compilerOptions: { skipLibCheck: true },
  skipAddingFilesFromTsConfig: true
});

const adminUi = project.addSourceFileAtPath(fromRoot("packages/admin-ui/dist/index.d.ts"));
const appAdmin = project.addSourceFileAtPath(
  fromRoot("packages/app-admin/dist/features/formModel/abstractions.d.ts")
);

/*
 * The components in scope are not listed here. They are read from the runtime that injects them, so
 * the contract cannot describe a component the sandbox does not provide, or omit one it does.
 */
const bundler = project.addSourceFileAtPath(
  fromRoot("packages/app-admin/src/features/generatedComponents/bundleRenderer.ts")
);
project.resolveSourceFileDependencies();

const readInjectedComponents = () => {
  const decl = bundler.getVariableDeclaration("INJECTED_COMPONENTS");
  if (!decl) {
    throw new Error("INJECTED_COMPONENTS not found in bundleRenderer.ts.");
  }
  return decl
    .getInitializer()
    .getText()
    .match(/"([^"]+)"/g)
    .map(s => s.replace(/"/g, ""));
};

/* Strip the outermost pair of parentheses, when they wrap the whole string. */
const unwrap = text => {
  if (!text.startsWith("(") || !text.endsWith(")")) {
    return text;
  }
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") {
      depth++;
    } else if (text[i] === ")") {
      depth--;
      if (depth === 0) {
        return i === text.length - 1 ? text.slice(1, -1) : text;
      }
    }
  }
  return text;
};

/*
 * Two things make printed types much longer than they are informative. A decorated component prints
 * its whole decorator wrapper, so `Input`'s `startIcon` arrives as several hundred characters that
 * say nothing a caller needs. And an overload that survives resolution prints as an intersection of
 * two identical signatures.
 */
const tidy = text => {
  let out = text
    .replace(/ \| undefined$/, "")
    .replace(/\bReact\./g, "")
    .replace(/import\([^)]*\)\./g, "")
    .replace(/\s+/g, " ")
    .trim();

  out = unwrap(out);

  const halves = out.split(" & ");
  if (halves.length === 2 && halves[0] === halves[1]) {
    out = halves[0];
  }

  out = unwrap(out);

  if (out.includes("displayName: string")) {
    out = out.replace(/ReactElement<[\s\S]*$/, "ReactElement");
  }

  return out;
};

/*
 * React's HTML attributes swamp everything: `InputProps` resolves to 309 properties, 292 of them
 * inherited attributes that say nothing about how to use the component. Dropping anything declared
 * inside @types/react leaves exactly the props the component defines itself. `children` is the one
 * deliberate exception, because whether a component takes children is what goes wrong most: a model
 * that pattern-matched on `Button` wrote `text=` on `Text`, which takes children.
 */
const isOwnProp = prop => {
  const decl = prop.getDeclarations()[0];
  if (!decl) {
    return false;
  }
  if (prop.getName() === "children") {
    return true;
  }
  return !decl.getSourceFile().getFilePath().includes("node_modules/@types/react");
};

const describe = (decl, { ownOnly }) => {
  const members = [];

  for (const prop of decl.getType().getProperties()) {
    if (ownOnly && !isOwnProp(prop)) {
      continue;
    }

    const node = prop.getDeclarations()[0];
    if (!node) {
      continue;
    }

    let type = tidy(prop.getTypeAtLocation(node).getText(node));
    if (type.length > MAX_TYPE_LEN) {
      type = `${type.slice(0, MAX_TYPE_LEN)}…`;
    }

    members.push({ name: prop.getName(), optional: prop.isOptional(), type });
  }

  /* Required first, then alphabetical. A stable order keeps the diff readable on regeneration,
   * and required-first is the order they get written in. */
  members.sort((a, b) => {
    if (a.optional !== b.optional) {
      return a.optional ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });

  return members;
};

const render = (title, members) => {
  if (members.length === 0) {
    return `${title}\n    (no members found — the generator could not resolve this type)`;
  }
  return `${title}\n${members.map(m => `    ${m.name}${m.optional ? "?" : ""}: ${m.type}`).join("\n")}`;
};

const lookup = (file, name) => {
  const decls = file.getExportedDeclarations().get(name);
  if (!decls || decls.length === 0) {
    throw new Error(
      `Could not resolve "${name}". It is no longer exported, or the package needs rebuilding.`
    );
  }
  return decls[0];
};

const buildTypeSurface = () => {
  const components = readInjectedComponents();
  const blocks = [];

  blocks.push("## Type reference");
  blocks.push(
    "Generated from the built types, so it cannot drift. Props inherited from the underlying DOM element (className, style, id, onFocus, ...) are not listed but do work."
  );

  /*
   * Fenced, because `yarn format` reformats markdown and strips the leading indentation these
   * blocks rely on, which both mangles the nesting and makes every regenerate-then-format cycle
   * produce a diff. A code fence is left alone by the formatter.
   */
  blocks.push("```");
  blocks.push("### Components");
  for (const component of components) {
    blocks.push(
      render(`  <${component}>`, describe(lookup(adminUi, `${component}Props`), { ownOnly: true }))
    );
  }

  blocks.push("### Types those signatures refer to");
  for (const name of SUPPORTING) {
    blocks.push(render(`  ${name}`, describe(lookup(adminUi, name), { ownOnly: false })));
  }

  blocks.push("### The field view model");
  for (const name of FIELD_TYPES) {
    blocks.push(render(`  ${name}`, describe(lookup(appAdmin, name), { ownOnly: false })));
  }

  blocks.push("```");

  return { surface: blocks.join("\n\n"), count: components.length };
};

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const write = (relPath, contents) => {
  const full = fromRoot(relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents, "utf8");
};

const GENERATED_NOTE = source =>
  `<!-- GENERATED FILE. Do not edit. Authored in ${source}; run \`yarn generate-skills\`. -->`;

const { surface, count } = buildTypeSurface();

for (const kind of KINDS) {
  const { frontmatter, sections } = parseKind(readFileSync(fromRoot(kind.source), "utf8"));

  /* The skill: shared knowledge, then the project-specific half, then the types. */
  const skill = [
    "---",
    frontmatter,
    "---",
    "",
    GENERATED_NOTE(kind.source),
    "",
    sections.shared,
    "",
    sections.dev,
    "",
    kind.withTypeSurface ? surface : ""
  ]
    .join("\n")
    .trimEnd();

  write(kind.skill, `${skill}\n`);

  /* The contract: sandbox constraints first, because they override anything the shared half
   * implies, then the shared knowledge, then the types. */
  const contract = [sections.admin, "", sections.shared, "", kind.withTypeSurface ? surface : ""]
    .join("\n")
    .trimEnd();

  const banner = `/*
 * GENERATED FILE. Do not edit.
 *
 * Authored in \`${kind.source}\` and rendered here by
 * \`scripts/generateExtensionContracts.mjs\`. Run \`yarn generate-skills\` to regenerate.
 *
 * The same source also produces the MCP skill a developer gets, so guidance cannot drift between
 * writing an extension by hand and having the assistant write one.
 */`;

  write(
    kind.contract,
    `${banner}\nexport const ${kind.exportName} = ${JSON.stringify(contract)};\n`
  );

  console.log(`${kind.source}`);
  console.log(`  -> ${kind.skill}`);
  console.log(`  -> ${kind.contract}`);
}

console.log(`\n${count} injected components, read from bundleRenderer.ts.`);
