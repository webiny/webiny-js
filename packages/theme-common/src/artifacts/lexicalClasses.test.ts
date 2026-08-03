import { describe, expect, it } from "vitest";
import { CANONICAL_TYPOGRAPHY_ROLE_PATHS, isCanonicalPath } from "~/canonical/index.js";
import {
    createLexicalThemeClasses,
    generateLexicalCss,
    getUnaccountedTypographyRoles,
    LEXICAL_CLASS_PREFIX,
    LEXICAL_TYPOGRAPHY_CLASSES,
    UNMAPPED_TYPOGRAPHY_ROLES
} from "./lexicalClasses.js";

describe("LEXICAL_TYPOGRAPHY_CLASSES", () => {
    it("only references canonical typography roles", () => {
        // A typo in a role path would emit `var(--wby-type-typo-…)`, which resolves to nothing and drops
        // the whole declaration — invisible unless something checks.
        for (const entry of LEXICAL_TYPOGRAPHY_CLASSES) {
            expect(isCanonicalPath(entry.role), entry.role).toBe(true);
        }
    });

    it("accounts for every canonical role, either mapped or explicitly not", () => {
        // The failure mode of a forgotten role is silent: that one element renders unthemed.
        expect(getUnaccountedTypographyRoles()).toEqual([]);
    });

    it("lists the unmapped roles as genuinely unmappable", () => {
        // Lexical has no structural element meaning "small body" or "caption", and inventing a class no
        // editor control can produce would be worse than leaving them out.
        for (const role of UNMAPPED_TYPOGRAPHY_ROLES) {
            expect(CANONICAL_TYPOGRAPHY_ROLE_PATHS).toContain(role);
            expect(LEXICAL_TYPOGRAPHY_CLASSES.map(e => e.role)).not.toContain(role);
        }
    });

    it("gives every element a distinct, prefixed class", () => {
        const classNames = LEXICAL_TYPOGRAPHY_CLASSES.map(entry => entry.className);

        expect(new Set(classNames).size).toBe(classNames.length);
        for (const className of classNames) {
            expect(className.startsWith(`${LEXICAL_CLASS_PREFIX}-`)).toBe(true);
        }
    });

    it("maps each Lexical element only once", () => {
        const keys = LEXICAL_TYPOGRAPHY_CLASSES.map(entry => entry.themeKey);
        expect(new Set(keys).size).toBe(keys.length);
    });
});

describe("createLexicalThemeClasses", () => {
    it("nests heading keys the way EditorThemeClasses declares them", () => {
        const classes = createLexicalThemeClasses() as {
            heading: Record<string, string>;
            paragraph: string;
        };

        expect(classes.heading.h1).toBe(`${LEXICAL_CLASS_PREFIX}-h1`);
        expect(classes.heading.h6).toBe(`${LEXICAL_CLASS_PREFIX}-h6`);
        expect(classes.paragraph).toBe(`${LEXICAL_CLASS_PREFIX}-p`);
    });

    it("covers all six heading levels", () => {
        const classes = createLexicalThemeClasses() as { heading: Record<string, string> };
        expect(Object.keys(classes.heading).sort()).toEqual(["h1", "h2", "h3", "h4", "h5", "h6"]);
    });

    it("includes the flat keys too", () => {
        const classes = createLexicalThemeClasses();

        expect(classes.code).toBe(`${LEXICAL_CLASS_PREFIX}-code`);
        expect(classes.quote).toBe(`${LEXICAL_CLASS_PREFIX}-quote`);
    });
});

describe("generateLexicalCss", () => {
    it("points each class at the theme's variables rather than at values", () => {
        // The whole point: the rules are static and cacheable, and only the variables change per theme.
        const css = generateLexicalCss();

        expect(css).toContain(`.${LEXICAL_CLASS_PREFIX}-h1 {`);
        expect(css).toContain("font-size: var(--wby-type-heading-1-size);");
        expect(css).toContain("font-family: var(--wby-type-heading-1-family);");
        expect(css).toContain("line-height: var(--wby-type-heading-1-line-height);");
        expect(css).toContain("letter-spacing: var(--wby-type-heading-1-letter-spacing);");
        expect(css).toContain("font-weight: var(--wby-type-heading-1-weight);");
    });

    it("emits a rule for every mapped element", () => {
        const css = generateLexicalCss();

        for (const entry of LEXICAL_TYPOGRAPHY_CLASSES) {
            expect(css, entry.className).toContain(`.${entry.className} {`);
        }
    });

    it("contains no literal values that would freeze the theme", () => {
        // A hex colour or a px size here would survive a theme change, which is exactly the bug this
        // whole mechanism exists to avoid. The one allowed literal is the blockquote's border width.
        const css = generateLexicalCss();

        expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
        expect(css.match(/\d+px/g) ?? []).toEqual(["3px"]);
    });

    it("gives the blockquote its border from a theme colour", () => {
        const css = generateLexicalCss();
        expect(css).toContain("border-inline-start: 3px solid var(--wby-color-border-subtle);");
    });

    it("can be scoped to a container", () => {
        const css = generateLexicalCss({ scope: ".wby-editor" });
        expect(css).toContain(`.wby-editor .${LEXICAL_CLASS_PREFIX}-h1 {`);
    });

    it("is unscoped by default", () => {
        const css = generateLexicalCss();
        expect(css).not.toContain(".wby-editor");
    });

    it("says it is generated, so nobody edits it by hand", () => {
        expect(generateLexicalCss()).toContain("do not edit");
    });
});
