import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useWebinySdk } from "../testHelpers/useWebinySdk";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { setupGroupAndModels } from "../testHelpers/setup";
import { createProductModel } from "./mocks/productModel";
import { createProductCategoryModel } from "./mocks/productCategoryModel";
import type { Container } from "@webiny/di";
import { GetModelUseCase } from "~/exports/api/cms/model.js";
import { ModelStorageSync } from "~/features/modelStorageSync/index.js";

interface ProductValues {
    name: string;
    sku: string;
    description: string;
    price: number;
}

/**
 * The search box (`search`) on a model with a text field (`name`) and a long-text field
 * (`description`).
 *
 * Every storage must pass the shared cases. pg matches whole words and word starts, and text
 * inside words only on text fields opted in with `settings.search.substrings`, so cases where
 * storages differ on purpose assert per storage.
 */
const isPg = (process.env.WEBINY_STORAGE || "").split(",").includes("pg");

describe("SDK GraphQL - CMS search modes", () => {
    const { sdk } = useWebinySdk();
    // The container of the latest manage request, for pg's services.
    let container: Container | undefined;
    const manageHandler = useGraphQLHandler({
        path: "manage",
        afterSetup: requestContainer => {
            container = requestContainer;
        }
    });

    const createAndPublishEntry = async (values: Partial<ProductValues>) => {
        const createResult = await sdk.cms.createEntry<ProductValues>({
            modelId: "product",
            data: { values: { sku: "SKU", price: 1, ...values } },
            fields: ["id"]
        });
        await sdk.cms.publishEntryRevision({
            modelId: "product",
            revisionId: createResult.value.id!,
            fields: ["id"]
        });
    };

    const searchNames = async (search: string): Promise<string[]> => {
        const result = await sdk.cms.listEntries<ProductValues>({
            modelId: "product",
            search,
            fields: ["id", "values.name"]
        });
        expect(result.isOk()).toBe(true);
        return result.value.data.map(entry => entry.values!.name!).sort();
    };

    let productModel: ReturnType<typeof createProductModel>;

    const setSearchSettings = async (fieldId: string, search: Record<string, boolean>) => {
        const [response] = await manageHandler.updateContentModelMutation({
            modelId: productModel.modelId,
            data: {
                name: productModel.name,
                layout: productModel.layout,
                titleFieldId: productModel.titleFieldId,
                fields: productModel.fields.map(field =>
                    field.fieldId === fieldId
                        ? { ...field, settings: { ...field.settings, search } }
                        : field
                )
            }
        });
        expect(response.data.updateContentModel.error).toBeNull();
    };
    // Text inside words: opt-in on pg; the other storages always match it.
    const enableSubstrings = () => setSearchSettings("name", { substrings: true });

    beforeEach(async () => {
        const { group } = await setupGroupAndModels({
            manager: manageHandler,
            models: undefined
        });
        productModel = createProductModel(group);
        for (const model of [createProductCategoryModel(group), productModel]) {
            await manageHandler.createContentModelMutation({
                data: {
                    ...model,
                    description: model.description || undefined,
                    icon: model.icon || undefined
                }
            });
        }
    });

    describe("text field", () => {
        it("finds text inside a word", async () => {
            await enableSubstrings();
            await createAndPublishEntry({ name: "Gaming Laptop" });
            await createAndPublishEntry({ name: "Wireless Mouse" });

            expect(await searchNames("aptop")).toEqual(["Gaming Laptop"]);
        });
    });

    describe("several words", () => {
        it("matches unquoted words in any order", async () => {
            await createAndPublishEntry({ name: "Gaming Laptop" });
            await createAndPublishEntry({ name: "Laptop for gaming" });
            await createAndPublishEntry({ name: "Gaming Mouse" });

            expect(await searchNames("laptop gaming")).toEqual([
                "Gaming Laptop",
                "Laptop for gaming"
            ]);
        });

        it("matches the word being typed by its start", async () => {
            await createAndPublishEntry({ name: "Gaming Laptop" });
            await createAndPublishEntry({ name: "Gamer Laptop" });
            await createAndPublishEntry({ name: "Wireless Mouse" });

            expect(await searchNames("laptop gam")).toEqual(["Gamer Laptop", "Gaming Laptop"]);
            expect(await searchNames("lap")).toEqual(["Gamer Laptop", "Gaming Laptop"]);
        });

        // Earlier words must be whole words on pg: a word start reads every word with that
        // start, which costs seconds on large models when several words are common.
        it.runIf(isPg)("matches earlier words as whole words", async () => {
            await createAndPublishEntry({ name: "Gaming Laptop" });
            await createAndPublishEntry({ name: "Gamer Laptop" });

            expect(await searchNames("gam laptop")).toEqual([]);
            expect(await searchNames("gaming laptop")).toEqual(["Gaming Laptop"]);
            // A trailing space or quote ends the last word too.
            expect(await searchNames("laptop gam ")).toEqual([]);
            expect(await searchNames("laptop gamer ")).toEqual(["Gamer Laptop"]);
        });

        it.runIf(isPg)("matches a quoted phrase only in order", async () => {
            await createAndPublishEntry({ name: "Gaming Laptop" });
            await createAndPublishEntry({ name: "Laptop for gaming" });

            expect(await searchNames(`"gaming laptop"`)).toEqual(["Gaming Laptop"]);
        });

        // Phrases are opt-in per field; only the model's title field ("name") has them by default.
        it.runIf(isPg)("matches quoted words in any order on a field without phrases", async () => {
            await createAndPublishEntry({
                name: "Job A",
                description: "The best candidate for the role"
            });
            await createAndPublishEntry({
                name: "Job B",
                description: "A candidate is the best fit"
            });

            expect(await searchNames(`"best candidate"`)).toEqual(["Job A", "Job B"]);
            expect(await searchNames(`"candidate for the"`)).toEqual(["Job A"]);
        });

        it.runIf(isPg)("matches a quoted phrase on a field with phrases enabled", async () => {
            await setSearchSettings("description", { phrases: true });
            await createAndPublishEntry({
                name: "Job A",
                description: "The best candidate for the role"
            });
            await createAndPublishEntry({
                name: "Job B",
                description: "A candidate is the best fit"
            });

            expect(await searchNames(`"best candidate"`)).toEqual(["Job A"]);
            expect(await searchNames(`"candidate for the"`)).toEqual(["Job A"]);
            expect(await searchNames(`"the best"`)).toEqual(["Job A", "Job B"]);
        });

        it.runIf(isPg)("matches a longer phrase only as one run of words", async () => {
            // Has every pair of "find the best price" (find the, the best, best price), not in one run.
            await createAndPublishEntry({ name: "The best price, find the best" });
            await createAndPublishEntry({ name: "How to find the best price" });

            expect(await searchNames(`"find the best price"`)).toEqual([
                "How to find the best price"
            ]);
        });

        it.runIf(isPg)("does not match a phrase split across two fields", async () => {
            await createAndPublishEntry({ name: "Gaming", description: "Laptop for work" });

            expect(await searchNames(`"gaming laptop"`)).toEqual([]);
            expect(await searchNames("gaming laptop")).toEqual(["Gaming"]);
        });

        it.runIf(isPg)("combines a phrase with loose words", async () => {
            await createAndPublishEntry({ name: "Gaming Laptop Pro" });
            await createAndPublishEntry({ name: "Gaming Laptop" });
            await createAndPublishEntry({ name: "Pro Laptop for gaming" });

            expect(await searchNames(`pro "gaming laptop"`)).toEqual(["Gaming Laptop Pro"]);
        });

        it.runIf(isPg)("treats an unmatched quote as plain words", async () => {
            await createAndPublishEntry({ name: "Gaming Laptop" });
            await createAndPublishEntry({ name: "Laptop for gaming" });

            expect(await searchNames(`"gaming laptop`)).toEqual([
                "Gaming Laptop",
                "Laptop for gaming"
            ]);
        });
    });

    describe("text field, inside words", () => {
        it.runIf(isPg)("needs at least 3 characters inside a word", async () => {
            await enableSubstrings();
            await createAndPublishEntry({ name: "Gaming Laptop" });

            expect(await searchNames("pto")).toEqual(["Gaming Laptop"]);
            expect(await searchNames("pt")).toEqual([]);
            // Word starts match from the first character.
            expect(await searchNames("la")).toEqual(["Gaming Laptop"]);
        });

        it.runIf(isPg)("does not match inside words longer than 32 characters", async () => {
            const longWord = "supercalifragilisticexpialidocious-x"; // 34 letters before the dash
            await enableSubstrings();
            await createAndPublishEntry({ name: longWord });

            expect(await searchNames("califragilistic")).toEqual([]);
            expect(await searchNames("supercali")).toEqual([longWord]);
        });

        it("finds parts of hyphenated codes", async () => {
            await createAndPublishEntry({ name: "LAP-001 Laptop" });
            await createAndPublishEntry({ name: "MOU-002 Mouse" });

            expect(await searchNames("LAP-001")).toEqual(["LAP-001 Laptop"]);
        });

        // Revision ids end in "#0001". Matching inside ids would make "001" find every entry.
        it.runIf(isPg)("does not match inside entry ids", async () => {
            await createAndPublishEntry({ name: "LAP-001 Laptop" });
            await createAndPublishEntry({ name: "MOU-002 Mouse" });

            expect(await searchNames("001")).toEqual(["LAP-001 Laptop"]);
        });

        it("matches non-Latin letters regardless of case", async () => {
            await enableSubstrings();
            await createAndPublishEntry({ name: "Über Straße" });
            await createAndPublishEntry({ name: "Plain Street" });

            expect(await searchNames("über")).toEqual(["Über Straße"]);
            expect(await searchNames("STRASSE")).toEqual([]);
            expect(await searchNames("raße")).toEqual(["Über Straße"]);
        });
    });

    describe("text field, contains and startsWith filters", () => {
        const filterNames = async (where: Record<string, string>): Promise<string[]> => {
            const result = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                where,
                fields: ["id", "values.name"]
            });
            expect(result.isOk()).toBe(true);
            return result.value.data.map(entry => entry.values!.name!).sort();
        };

        it("contains matches text inside words, punctuation and long words", async () => {
            await enableSubstrings();
            await createAndPublishEntry({ name: "Gaming Laptop w/ case" });
            await createAndPublishEntry({ name: "supercalifragilisticexpialidocious" });
            await createAndPublishEntry({ name: "Wireless Mouse" });

            expect(await filterNames({ "values.name_contains": "aptop" })).toEqual([
                "Gaming Laptop w/ case"
            ]);
            expect(await filterNames({ "values.name_contains": "ing lap" })).toEqual([
                "Gaming Laptop w/ case"
            ]);
            expect(await filterNames({ "values.name_contains": "p w/ c" })).toEqual([
                "Gaming Laptop w/ case"
            ]);
            expect(await filterNames({ "values.name_contains": "fragilistic" })).toEqual([
                "supercalifragilisticexpialidocious"
            ]);
            expect(await filterNames({ "values.name_contains": "ss" })).toEqual(["Wireless Mouse"]);
            expect(await filterNames({ "values.name_contains": "laptops" })).toEqual([]);
        });

        it("contains matches word starts on a field without substrings", async () => {
            await createAndPublishEntry({ name: "hello there" });
            await createAndPublishEntry({ name: "SKU-001234 notebook" });

            expect(await filterNames({ "values.name_contains": "hello" })).toEqual(["hello there"]);
            expect(await filterNames({ "values.name_contains": "there" })).toEqual(["hello there"]);
            expect(await filterNames({ "values.name_contains": "the" })).toEqual(["hello there"]);
            expect(await filterNames({ "values.name_contains": "hello the" })).toEqual([
                "hello there"
            ]);
            // Text inside a word matches only with substrings (pg) or on other storages.
            const inside = (name: string) => (isPg ? [] : [name]);
            expect(await filterNames({ "values.name_contains": "ello" })).toEqual(
                inside("hello there")
            );
            expect(await filterNames({ "values.name_contains": "lo there" })).toEqual(
                inside("hello there")
            );
            expect(await filterNames({ "values.name_contains": "book" })).toEqual(
                inside("SKU-001234 notebook")
            );
            expect(await filterNames({ "values.name_contains": "1234" })).toEqual(
                inside("SKU-001234 notebook")
            );
            expect(await filterNames({ "values.name_not_contains": "ello" })).toEqual(
                isPg ? ["SKU-001234 notebook", "hello there"] : ["SKU-001234 notebook"]
            );
            expect(await searchNames("ello")).toEqual(inside("hello there"));
            expect(await searchNames("there")).toEqual(["hello there"]);
        });

        it("startsWith matches the start of the value", async () => {
            await createAndPublishEntry({ name: "Gaming Laptop" });
            await createAndPublishEntry({ name: "Laptop for gaming" });
            // Longer than OpenSearch keeps for exact matching (256 characters).
            const long = `Gaming mouse ${"pad ".repeat(80)}`.trim();
            await createAndPublishEntry({ name: long });

            expect(await filterNames({ "values.name_startsWith": "Gaming La" })).toEqual([
                "Gaming Laptop"
            ]);
            expect(await filterNames({ "values.name_startsWith": "lap" })).toEqual([
                "Laptop for gaming"
            ]);
            expect(await filterNames({ "values.name_startsWith": "gaming" })).toEqual([
                "Gaming Laptop",
                long
            ]);
            expect(await filterNames({ "values.name_startsWith": "gaming mo" })).toEqual([long]);
            expect(await filterNames({ "values.name_startsWith": "aptop" })).toEqual([]);
            expect(await filterNames({ "values.name_not_startsWith": "gaming" })).toEqual([
                "Laptop for gaming"
            ]);
        });
    });

    /**
     * pg counts matches up to a cap (WEBINY_PG_COUNT_CAP, 10,000 by default) and picks
     * the query plan from that count: few matches are read through the search indexes and sorted,
     * many are found by walking the sort index. Both plans must return the same pages.
     */
    describe("results around the count cap", () => {
        const listPages = async (params: { search?: string; where?: Record<string, unknown> }) => {
            const names: string[] = [];
            let totalCount = -1;
            let after: string | undefined = undefined;
            for (let page = 0; page < 10; page++) {
                const result = await sdk.cms.listEntries<ProductValues>({
                    modelId: "product",
                    ...params,
                    sort: { values_price: "desc" },
                    limit: 2,
                    after,
                    fields: ["id", "values.name"]
                });
                expect(result.isOk()).toBe(true);
                names.push(...result.value.data.map(entry => entry.values!.name!));
                totalCount = result.value.meta.totalCount;
                if (!result.value.meta.hasMoreItems) {
                    break;
                }
                after = result.value.meta.cursor || undefined;
            }
            return { names, totalCount };
        };

        const seed = async () => {
            await createAndPublishEntry({ name: "Laptop A", price: 300 });
            await createAndPublishEntry({ name: "Laptop B", price: 100 });
            await createAndPublishEntry({ name: "Mouse", price: 250 });
            await createAndPublishEntry({ name: "Laptop C", price: 500 });
            await createAndPublishEntry({ name: "Laptop D", price: 200 });
            await createAndPublishEntry({ name: "Laptop E", price: 400 });
        };

        const expected = ["Laptop C", "Laptop E", "Laptop A", "Laptop D", "Laptop B"];

        afterEach(() => {
            delete process.env.WEBINY_PG_COUNT_CAP;
        });

        it("pages a sorted search the same below and above the cap", async () => {
            await seed();

            expect(await listPages({ search: "laptop" })).toEqual({
                names: expected,
                totalCount: 5
            });

            process.env.WEBINY_PG_COUNT_CAP = "3";
            expect(await listPages({ search: "laptop" })).toEqual({
                names: expected,
                totalCount: isPg ? 3 : 5
            });
        });

        it("pages a sorted filter the same below and above the cap", async () => {
            await seed();
            const where = { "values.name_contains": "lap" };

            expect(await listPages({ where })).toEqual({ names: expected, totalCount: 5 });

            process.env.WEBINY_PG_COUNT_CAP = "3";
            expect(await listPages({ where })).toEqual({
                names: expected,
                totalCount: isPg ? 3 : 5
            });
        });

        // Entries without a value sort first in DESC order; pg reads them by a separate path.
        it("pages a list sorted by a field with empty values the same at any cap", async () => {
            await manageHandler.updateContentModelMutation({
                modelId: productModel.modelId,
                data: {
                    name: productModel.name,
                    layout: productModel.layout,
                    titleFieldId: productModel.titleFieldId,
                    fields: productModel.fields.map(field =>
                        field.fieldId === "price" ? { ...field, validation: [] } : field
                    )
                }
            });
            await seed();
            await createAndPublishEntry({ name: "Laptop X", price: null as unknown as number });
            await createAndPublishEntry({ name: "Laptop Y", price: null as unknown as number });

            const pages: Record<string, { names: string[] }> = {};
            for (const cap of ["", "3", "1"]) {
                if (cap) {
                    process.env.WEBINY_PG_COUNT_CAP = cap;
                }
                pages[`unfiltered ${cap}`] = await listPages({});
                pages[`search ${cap}`] = await listPages({ search: "laptop" });
            }
            for (const [label, { names }] of Object.entries(pages)) {
                expect(names.slice(0, 2).sort(), label).toEqual(["Laptop X", "Laptop Y"]);
                expect(names.slice(2), label).toEqual(
                    label.startsWith("search")
                        ? expected
                        : ["Laptop C", "Laptop E", "Laptop A", "Mouse", "Laptop D", "Laptop B"]
                );
                expect(names, label).toEqual(
                    pages[label.startsWith("search") ? "search " : "unfiltered "].names
                );
            }
        });

        // pg estimates each condition on its own to choose how to read; the result must not change.
        it("pages an OR of a range and a name the same below and above the cap", async () => {
            await seed();
            const where = { OR: [{ "values.price_gte": 400 }, { "values.name": "Mouse" }] };
            const names = ["Laptop C", "Laptop E", "Mouse"];

            expect(await listPages({ where })).toEqual({ names, totalCount: 3 });

            process.env.WEBINY_PG_COUNT_CAP = "2";
            expect(await listPages({ where })).toEqual({
                names,
                totalCount: isPg ? 2 : 3
            });
        });

        it("pages a range with a text prefix the same below and above the cap", async () => {
            await seed();
            const where = {
                "values.price_between": [150, 350],
                "values.name_startsWith": "Laptop"
            };
            const names = ["Laptop A", "Laptop D"];

            expect(await listPages({ where })).toEqual({ names, totalCount: 2 });

            process.env.WEBINY_PG_COUNT_CAP = "1";
            expect(await listPages({ where })).toEqual({
                names,
                totalCount: isPg ? 1 : 2
            });
        });

        it("pages a search of several words the same below and above the cap", async () => {
            await seed();
            await createAndPublishEntry({ name: "Laptop Stand", price: 50 });
            await createAndPublishEntry({ name: "Stand Lamp", price: 60 });

            expect(await listPages({ search: "laptop stand" })).toEqual({
                names: ["Laptop Stand"],
                totalCount: 1
            });
            expect(await listPages({ search: "stand" })).toEqual({
                names: ["Stand Lamp", "Laptop Stand"],
                totalCount: 2
            });

            process.env.WEBINY_PG_COUNT_CAP = "1";
            expect(await listPages({ search: "stand" })).toEqual({
                names: ["Stand Lamp", "Laptop Stand"],
                totalCount: isPg ? 1 : 2
            });
        });

        it("caps the total of an unfiltered list", async () => {
            await seed();
            process.env.WEBINY_PG_COUNT_CAP = "3";

            const { names, totalCount } = await listPages({});
            expect(names).toEqual([
                "Laptop C",
                "Laptop E",
                "Laptop A",
                "Mouse",
                "Laptop D",
                "Laptop B"
            ]);
            expect(totalCount).toBe(isPg ? 3 : 6);
        });
    });

    describe("long-text field", () => {
        it("finds whole words and word starts", async () => {
            await createAndPublishEntry({
                name: "Gaming Laptop",
                description: "High-performance machine"
            });
            await createAndPublishEntry({ name: "Wireless Mouse", description: "Ergonomic" });

            expect(await searchNames("machine")).toEqual(["Gaming Laptop"]);
            expect(await searchNames("perform")).toEqual(["Gaming Laptop"]);
        });

        it("finds text inside a word only outside pg", async () => {
            await createAndPublishEntry({
                name: "Gaming Laptop",
                description: "High-performance machine"
            });

            expect(await searchNames("ormance")).toEqual(isPg ? [] : ["Gaming Laptop"]);
        });
    });

    // pg's search syntax: `*` at the start of a word matches text inside words, at the end
    // word starts. Through the index on fields with substrings, by testing each row elsewhere.
    describe.runIf(isPg)("wildcards", () => {
        const createProducts = async () => {
            await createAndPublishEntry({ name: "Gaming Laptop" });
            await createAndPublishEntry({ name: "Wireless Mouse" });
        };

        it("matches text inside words with a leading wildcard", async () => {
            await createProducts();

            expect(await searchNames("*aptop")).toEqual(["Gaming Laptop"]);
            expect(await searchNames("*xyz")).toEqual([]);
        });

        it("matches text inside words with a leading wildcard on a field with substrings", async () => {
            await enableSubstrings();
            await createProducts();

            expect(await searchNames("*aptop")).toEqual(["Gaming Laptop"]);
        });

        it("matches word starts with a trailing wildcard", async () => {
            await createProducts();

            expect(await searchNames("wire*")).toEqual(["Wireless Mouse"]);
        });
    });

    // Search settings changed on a model with entries: a background task reindexes them in batches.
    describe.runIf(isPg)("reindexing", () => {
        // What the background task runs after the change (ModelStorageSync), step by step.
        const reindex = async () => {
            const [sync] = container!.resolveAll(ModelStorageSync);
            const model = await container!.resolve(GetModelUseCase).execute("product");
            let cursor: string | null = null;
            for (;;) {
                // A deadline in the past: one batch per step.
                const result = await sync.run(model.value, { cursor, deadline: 0 });
                if (result.done) {
                    return;
                }
                cursor = result.cursor;
            }
        };

        it("finds old entries by text inside words once they are reindexed", async () => {
            await createAndPublishEntry({ name: "Gaming Laptop" });
            await createAndPublishEntry({ name: "Wireless Mouse" });

            await enableSubstrings();
            // Saved before the change: no substrings indexed yet.
            expect(await searchNames("aptop")).toEqual([]);

            await reindex();
            expect(await searchNames("aptop")).toEqual(["Gaming Laptop"]);
            expect(await searchNames("wireless")).toEqual(["Wireless Mouse"]);
        });
    });
});
