import { describe, expect, it } from "vitest";
import { assertRegularModel } from "~/features/simpleContentEntries/domain/assertRegularModel.js";
import { assertSimpleModel } from "~/features/simpleContentEntries/domain/assertSimpleModel.js";
import { SIMPLE_MODEL_TAG } from "~/features/simpleContentEntries/constants.js";
import type { CmsModel } from "~/types/index.js";

const model = (tags?: string[]): CmsModel => {
    return { modelId: "someModel", tags } as unknown as CmsModel;
};

describe("model guards", () => {
    describe("assertSimpleModel", () => {
        it("passes a tagged model", () => {
            expect(() => assertSimpleModel(model([SIMPLE_MODEL_TAG]))).not.toThrow();
        });

        it("passes a tagged model carrying other tags too", () => {
            expect(() => assertSimpleModel(model(["other", SIMPLE_MODEL_TAG]))).not.toThrow();
        });

        it("refuses an untagged model", () => {
            expect(() => assertSimpleModel(model(["other"]))).toThrow(/is not a simple model/);
        });

        it("refuses a model with no tags at all", () => {
            expect(() => assertSimpleModel(model())).toThrow(/is not a simple model/);
        });

        it("reports the ModelNotSimple code", () => {
            try {
                assertSimpleModel(model());
                expect.unreachable("should have thrown");
            } catch (error) {
                expect(error.code).toBe("Cms/SimpleEntry/ModelNotSimple");
            }
        });
    });

    describe("assertRegularModel", () => {
        it("passes an untagged model", () => {
            expect(() => assertRegularModel(model(["other"]))).not.toThrow();
        });

        it("passes a model with no tags at all", () => {
            expect(() => assertRegularModel(model())).not.toThrow();
        });

        it("refuses a tagged model", () => {
            expect(() => assertRegularModel(model([SIMPLE_MODEL_TAG]))).toThrow(
                /is a simple model/
            );
        });

        it("reports the ModelIsSimple code", () => {
            try {
                assertRegularModel(model([SIMPLE_MODEL_TAG]));
                expect.unreachable("should have thrown");
            } catch (error) {
                expect(error.code).toBe("Cms/SimpleEntry/ModelIsSimple");
            }
        });
    });

    /*
     * The guard only earns its place if it is actually wired into every mutating repository. A
     * partial rollout leaves exactly the gaps it exists to close, so this asserts the wiring
     * rather than the function.
     */
    describe("wiring", () => {
        const MUTATING = [
            "CreateEntry/CreateEntryRepository.ts",
            "CreateEntryRevisionFrom/CreateEntryRevisionFromRepository.ts",
            "UpdateEntry/UpdateEntryRepository.ts",
            "PublishEntry/PublishEntryRepository.ts",
            "UnpublishEntry/UnpublishEntryRepository.ts",
            "RepublishEntry/RepublishEntryRepository.ts",
            "DeleteEntry/DeleteEntryRepository.ts",
            "DeleteEntry/MoveEntryToBinRepository.ts",
            "DeleteEntryRevision/DeleteEntryRevisionRepository.ts",
            "DeleteMultipleEntries/DeleteMultipleEntriesRepository.ts",
            "MoveEntry/MoveEntryRepository.ts",
            "RestoreEntryFromBin/RestoreEntryFromBinRepository.ts"
        ];

        const read = async (rel: string) => {
            const { readFile } = await import("node:fs/promises");
            const { fileURLToPath } = await import("node:url");
            const base = fileURLToPath(
                new URL("../../../src/features/contentEntry/", import.meta.url)
            );
            return readFile(`${base}${rel}`, "utf-8");
        };

        it.each(MUTATING)("%s calls assertRegularModel", async rel => {
            const source = await read(rel);
            expect(source).toContain("assertRegularModel(model);");
        });

        it("leaves every other repository unguarded, so simple entries stay readable", async () => {
            const { readdir, readFile } = await import("node:fs/promises");
            const { fileURLToPath } = await import("node:url");
            const base = fileURLToPath(
                new URL("../../../src/features/contentEntry/", import.meta.url)
            );

            const found: string[] = [];
            const walk = async (dir: string, prefix: string) => {
                for (const item of await readdir(dir, { withFileTypes: true })) {
                    if (item.isDirectory()) {
                        await walk(`${dir}${item.name}/`, `${prefix}${item.name}/`);
                    } else if (item.name.endsWith("Repository.ts")) {
                        found.push(`${prefix}${item.name}`);
                    }
                }
            };
            await walk(base, "");

            const unguarded = found.filter(rel => !MUTATING.includes(rel));
            expect(unguarded.length).toBeGreaterThan(0);

            for (const rel of unguarded) {
                const source = await readFile(`${base}${rel}`, "utf-8");
                expect(source, `${rel} should not be guarded`).not.toContain("assertRegularModel");
            }
        });

        it("guards every repository that writes, and only those", async () => {
            const { readdir } = await import("node:fs/promises");
            const { fileURLToPath } = await import("node:url");
            const base = fileURLToPath(
                new URL("../../../src/features/contentEntry/", import.meta.url)
            );

            const found: string[] = [];
            const walk = async (dir: string, prefix: string) => {
                for (const item of await readdir(dir, { withFileTypes: true })) {
                    if (item.isDirectory()) {
                        await walk(`${dir}${item.name}/`, `${prefix}${item.name}/`);
                    } else if (item.name.endsWith("Repository.ts")) {
                        found.push(`${prefix}${item.name}`);
                    }
                }
            };
            await walk(base, "");

            // Every name in MUTATING must actually exist on disk.
            expect(MUTATING.filter(rel => !found.includes(rel))).toEqual([]);
        });
    });
});
