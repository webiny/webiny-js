import path from "path";
import fs from "fs";
import { describe, expect, it } from "vitest";

const templatesRoot = path.resolve(import.meta.dirname, "..", "_templates");
const baseSrc = path.join(templatesRoot, "appTemplates", "api", "graphql", "src");
const extensionsRoot = path.join(templatesRoot, "extensions");

/**
 * The api workspace's entry files: each one becomes a bundle that a function runs (`index.ts` for
 * the Lambda functions, `web.ts` for the Lambda web function). `extensions.ts` is the project's own
 * code, which every entry imports.
 */
const baseEntries = fs
    .readdirSync(baseSrc)
    .filter(file => file.endsWith(".ts") && file !== "extensions.ts")
    .sort();

/**
 * A storage extension (Postgres, OpenSearch) copies its `api/graphql/src` over the workspace. One
 * that replaces some entries but not others leaves a function running the base template's storage.
 */
const storageExtensions = fs.readdirSync(extensionsRoot).filter(name => {
    return fs.existsSync(path.join(extensionsRoot, name, "api", "graphql", "src", "index.ts"));
});

describe("api entry templates", () => {
    it("finds the base entries and the storage extensions", () => {
        expect(baseEntries).toEqual(["index.ts", "web.ts"]);
        expect(storageExtensions.length).toBeGreaterThan(0);
    });

    it.each(storageExtensions)("%s replaces every entry the base template has", extension => {
        const src = path.join(extensionsRoot, extension, "api", "graphql", "src");
        const missing = baseEntries.filter(entry => !fs.existsSync(path.join(src, entry)));
        expect(missing).toEqual([]);
    });
});
