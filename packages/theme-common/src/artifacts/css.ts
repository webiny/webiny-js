import { generateFluidValue, toCssDeclarations } from "~/fluid/clamp.js";
import { toCssVariableName } from "~/naming/cssVariable.js";
import type { ResolvedThemeSnapshot, SnapshotToken } from "~/snapshot.js";
import { tokenToDeclarations, type CssDeclaration } from "./values.js";
import { buildFontImport } from "./fonts.js";
import { generateLexicalCss } from "./lexicalClasses.js";

/**
 * Declared once at the top of every stylesheet, above the font import, so precedence between the
 * component registry and theme overrides never depends on which file the browser parses first (C10).
 * Nothing populates `wby-registry` yet — the component module will — but the contract is established now.
 */
export const CASCADE_LAYER_STATEMENT = "@layer wby-registry, wby-overrides;";

/**
 * The CSS artifact — see the design brief, section 6.2.
 *
 * A generated projection of the frozen snapshot, for the browser. Light values sit under `:root`,
 * dark under `[data-wby-theme-mode="dark"]`.
 *
 * DEVIATION FROM THE BRIEF'S WORDING. The brief asks for "a `prefers-color-scheme: dark` block
 * setting that attribute by default". CSS cannot set an HTML attribute, so the equivalent — and the
 * standard pattern — is to re-declare the dark values inside the media query, scoped so that an
 * explicit `light` attribute still wins:
 *
 * ```css
 * :root { --wby-color-surface-page: #F8FAFC; }
 * [data-wby-theme-mode="dark"] { --wby-color-surface-page: #0F172A; }
 * @media (prefers-color-scheme: dark) {
 *   :root:not([data-wby-theme-mode="light"]) { --wby-color-surface-page: #0F172A; }
 * }
 * ```
 *
 * The behaviour the brief asked for is preserved: follow the system by default, explicit attribute
 * overrides.
 */

export const THEME_MODE_ATTRIBUTE = "data-wby-theme-mode";

const DARK_SELECTOR = `[${THEME_MODE_ATTRIBUTE}="dark"]`;
const LIGHT_SELECTOR = `[${THEME_MODE_ATTRIBUTE}="light"]`;
const SYSTEM_DARK_SELECTOR = `:root:not(${LIGHT_SELECTOR})`;

export interface GenerateCssOptions {
    themeId?: string;
    version?: number;
    indent?: string;
}

/** Expands one snapshot token into its declarations, emitting a fluid pair where one applies. */
const declarationsFor = (
    token: SnapshotToken,
    viewport: ResolvedThemeSnapshot["settings"]["viewport"]
): string[] => {
    const variableName = toCssVariableName(token.path);

    if (token.fluid) {
        // Fallback first, then the clamp() — both constraints from section 4.5 are enforced by the
        // generator, not restated here.
        return toCssDeclarations(variableName, generateFluidValue({ step: token.fluid, viewport }));
    }

    return tokenToDeclarations(token, variableName).map(
        (declaration: CssDeclaration) => `${declaration.name}: ${declaration.value};`
    );
};

const block = (selector: string, declarations: string[], indent: string): string => {
    if (declarations.length === 0) {
        return "";
    }
    const body = declarations.map(declaration => `${indent}${declaration}`).join("\n");
    return `${selector} {\n${body}\n}`;
};

export const generateCssArtifact = (
    snapshot: ResolvedThemeSnapshot,
    options: GenerateCssOptions = {}
): string => {
    const indent = options.indent ?? "    ";
    const viewport = snapshot.settings.viewport;

    const lightByPath = new Map(snapshot.modes.light.map(token => [token.path, token]));

    const lightDeclarations = snapshot.modes.light.flatMap(token =>
        declarationsFor(token, viewport)
    );

    // Only tokens whose dark value actually differs are re-declared. Spacing, radii and type sizes
    // are mode-invariant, so emitting them twice would double the file for nothing.
    const darkDeclarations = snapshot.modes.dark.flatMap(token => {
        const light = lightByPath.get(token.path);
        if (light && JSON.stringify(light.value) === JSON.stringify(token.value)) {
            return [];
        }
        return declarationsFor(token, viewport);
    });

    const header = [
        "/*",
        ` * Webiny theme${options.themeId ? ` ${options.themeId}` : ""}${
            options.version === undefined ? "" : ` v${options.version}`
        }`,
        ` * Generated from the published snapshot resolved at ${snapshot.resolvedAt}.`,
        " * This file is generated. Edit the theme, not this.",
        " */"
    ].join("\n");

    const sections = [header, block(":root", lightDeclarations, indent)];

    if (darkDeclarations.length > 0) {
        sections.push(block(DARK_SELECTOR, darkDeclarations, indent));

        // `force-light` deliberately emits no media query: the site stays light until something
        // explicitly sets the attribute. `force-dark` applies the dark values unconditionally.
        const defaultMode = snapshot.policy.defaultMode;

        if (defaultMode === "system") {
            const inner = block(SYSTEM_DARK_SELECTOR, darkDeclarations, indent + indent)
                .split("\n")
                .map(line => (line.length > 0 ? `${indent}${line}` : line))
                .join("\n");
            sections.push(`@media (prefers-color-scheme: dark) {\n${inner}\n}`);
        }

        if (defaultMode === "dark") {
            sections.push(block(SYSTEM_DARK_SELECTOR, darkDeclarations, indent));
        }
    }

    // The rich-text structural rules ride in the same artifact as the variables they read, so the single
    // theme `<link>` the frontend already loads themes Website Builder's `wb-lx-*` rich text too — with no
    // extra request and no content migration (the classes are already baked into every saved page).
    sections.push(generateLexicalCss());

    // Prelude, in the order CSS requires: the layer statement, then the font `@import` (which may only
    // be preceded by `@charset` and `@layer`), then everything else. See C9 and C10.
    const prelude = [CASCADE_LAYER_STATEMENT, buildFontImport(snapshot.settings.fonts)].filter(
        Boolean
    );

    return `${[...prelude, ...sections].filter(Boolean).join("\n\n")}\n`;
};
