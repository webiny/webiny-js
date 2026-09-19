/*
 * Generates the type surface handed to the assistant when it writes a field renderer.
 *
 * Run: node packages/ai-powerups/scripts/generateRendererContract.mjs
 * (from the repo root, after `admin-ui` and `app-admin` have been built)
 *
 * Why this is generated rather than written: the contract began as prose, and three separate
 * generated renderers failed on facts it stated wrongly or left out. `Text` takes children while
 * `Button` takes a `text` prop, `Tree` renames its wrapped library's `tree`/`render` props to
 * `nodes`/`renderer`, and `field.validation` is a result rather than a list of rules. None of those
 * are judgement calls; they are all written down in the types already. Anything a compiler can tell
 * the model belongs here. What it CANNOT tell the model (that `sort={false}` is effectively
 * mandatory, that a renderer must not hold field data in local state) stays hand-written in
 * `rendererContract.ts`.
 */
import { Project } from "ts-morph";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

/* Resolved from this file rather than from cwd, so it works whether it is run from the repo root
 * or through `yarn workspace @webiny/ai-powerups generate-renderer-contract`. */
const ROOT = resolve(import.meta.dirname, "..", "..", "..");
const fromRoot = (...parts) => join(ROOT, ...parts);

const OUT_REL = "packages/ai-powerups/src/api/features/AdminComponents/typeSurface.generated.ts";
const OUT = fromRoot(OUT_REL);

/* The components a generated renderer is allowed to use. Keep in step with `rendererRuntime.ts`:
 * that file decides what is in scope, this one describes it. */
const COMPONENTS = [
  "InputProps",
  "TextProps",
  "ButtonProps",
  "IconProps",
  "IconButtonProps",
  "FormComponentLabelProps",
  "FormComponentDescriptionProps",
  "TreeProps"
];

/* Types the signatures above refer to, so a callback parameter is not an opaque name. */
const SUPPORTING = ["NodeDto", "NodeFormattedDefaultData", "DropOptions"];

/* The view model every renderer is handed. */
const FIELD_TYPES = ["IFieldVM", "IFieldValidation", "IObjectFieldVM", "IObjectFieldItemVM"];

const MAX_TYPE_LEN = 110;

const project = new Project({
  compilerOptions: { skipLibCheck: true },
  skipAddingFilesFromTsConfig: true
});

const adminUi = project.addSourceFileAtPath(fromRoot("packages/admin-ui/dist/index.d.ts"));
const appAdmin = project.addSourceFileAtPath(
  fromRoot("packages/app-admin/dist/features/formModel/abstractions.d.ts")
);
project.resolveSourceFileDependencies();

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
 * Two things make the printed types much longer than they are informative.
 *
 * A decorated component prints its whole decorator wrapper, so `Input`'s `startIcon` arrives as
 * several hundred characters of `ReactElement<... original ... displayName ...>` that say nothing a
 * caller needs. And an overload that survives resolution prints as an intersection of two identical
 * signatures. Both collapse to something a reader can use.
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

  /*
   * `makeDecoratable` wraps a component in an object carrying `original`/`displayName`, and the
   * printer expands all of it. The only part a caller needs is that the prop takes an element.
   */
  if (out.includes("displayName: string")) {
    out = out.replace(/ReactElement<[\s\S]*$/, "ReactElement");
  }

  return out;
};

/*
 * React's HTML attributes swamp everything: InputProps resolves to 309 properties, 292 of them
 * inherited div/input attributes that say nothing about how to use the component. Dropping anything
 * declared inside @types/react leaves exactly the props the component defines itself. `children` is
 * the one deliberate exception, because whether a component takes children is the thing that goes
 * wrong most (Text takes them, and a model that pattern-matched on Button wrote text= instead).
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

    members.push({
      name: prop.getName(),
      optional: prop.isOptional(),
      type
    });
  }

  /* Required first, then alphabetical: a stable order keeps the diff readable when this is
   * regenerated, and putting the required props first is the order they get written in. */
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
  const lines = members.map(m => `    ${m.name}${m.optional ? "?" : ""}: ${m.type}`);
  return `${title}\n${lines.join("\n")}`;
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

const blocks = [];

blocks.push("COMPONENTS. These are the only ones in scope, and these are all of their own props.");
blocks.push(
  "Props inherited from the underlying DOM element (className, style, id, onFocus, ...) are not listed but do work."
);
for (const name of COMPONENTS) {
  const label = name.replace(/Props$/, "");
  blocks.push(render(`  <${label}>`, describe(lookup(adminUi, name), { ownOnly: true })));
}

blocks.push("\nTYPES THOSE SIGNATURES REFER TO.");
for (const name of SUPPORTING) {
  blocks.push(render(`  ${name}`, describe(lookup(adminUi, name), { ownOnly: false })));
}

blocks.push("\nTHE FIELD VIEW MODEL. Every renderer is called with { field }.");
for (const name of FIELD_TYPES) {
  blocks.push(render(`  ${name}`, describe(lookup(appAdmin, name), { ownOnly: false })));
}

const surface = blocks.join("\n\n");

const banner = `/*
 * GENERATED FILE. Do not edit.
 *
 * Regenerate with:
 *   node packages/ai-powerups/scripts/generateRendererContract.mjs
 *
 * Read from the built types of \`@webiny/admin-ui\` and \`@webiny/app-admin\`, so it cannot drift from
 * the components a generated renderer is actually handed. The rules that types cannot express live
 * beside it in \`rendererContract.ts\`.
 */`;

writeFileSync(OUT, `${banner}\nexport const TYPE_SURFACE = ${JSON.stringify(surface)};\n`, "utf8");

const componentCount = COMPONENTS.length + SUPPORTING.length + FIELD_TYPES.length;
console.log(`Wrote ${OUT_REL}`);
console.log(`${componentCount} types, ${surface.split("\n").length} lines.`);
