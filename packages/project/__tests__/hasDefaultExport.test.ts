import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Project } from "ts-morph";
import { hasDefaultExport } from "~/extensions/hasDefaultExport.js";

const cases: [string, string, boolean][] = [
    ["an exported expression", `const Extension = () => null;\nexport default Extension;`, true],
    ["a default function", `export default function Extension() {}`, true],
    ["an anonymous default function", `export default () => null;`, true],
    ["a default class", `export default class Extension {}`, true],
    [
        "a local name exported as default",
        `const Extension = 1;\nexport { Extension as default };`,
        true
    ],
    ["a re-exported default", `export { default } from "./Extension.js";`, true],
    [
        "a re-export renamed to default",
        `export { Extension as default } from "./Extension.js";`,
        true
    ],
    ["a string-literal default", `const Extension = 1;\nexport { Extension as "default" };`, true],
    ["a re-exported string-literal default", `export { "default" } from "./Extension.js";`, true],
    [
        "a string-literal default re-exported under a name",
        `export { "default" as Extension } from "./Extension.js";`,
        false
    ],
    ["a named export", `export const Extension = () => null;`, false],
    ["a named function", `export function Extension() {}`, false],
    [
        "a default re-exported under a name",
        `export { default as Extension } from "./Extension.js";`,
        false
    ],
    ["a star re-export", `export * from "./Extension.js";`, false],
    ["export equals", `const Extension = 1;\nexport = Extension;`, false],
    ["no exports", `const Extension = 1;`, false]
];

describe("hasDefaultExport", () => {
    it.each(cases)("detects %s", (_, code, expected) => {
        const project = new Project({ useInMemoryFileSystem: true });
        const source = project.createSourceFile("/Extension.tsx", code);

        expect(hasDefaultExport(source)).toBe(expected);
    });

    // The type checker is what `getDefaultExportSymbol()` used before. Both have to agree on every
    // form, or an extension would start being imported the wrong way.
    it.each(cases)("agrees with the type checker on %s", (_, code) => {
        const project = new Project({ useInMemoryFileSystem: true });
        const source = project.createSourceFile("/Extension.tsx", code);

        const viaChecker = source.getDefaultExportSymbol() !== undefined;

        expect(hasDefaultExport(source)).toBe(viaChecker);
    });
});
