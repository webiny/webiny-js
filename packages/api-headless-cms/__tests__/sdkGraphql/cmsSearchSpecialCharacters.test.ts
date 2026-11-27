import { beforeEach, describe, expect, it } from "vitest";
import { useWebinySdk } from "../testHelpers/useWebinySdk";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { setupGroupAndModels } from "../testHelpers/setup";
import { createProductModel } from "./mocks/productModel";
import { createProductCategoryModel } from "./mocks/productCategoryModel";

interface ProductValues {
    name: string;
    sku: string;
    description: string;
    price: number;
}

/**
 * Entry names with punctuation in them. Each one is typed into the search one character at a time,
 * the way a user types it, and the entry has to stay in the results after every character.
 */
const names = [
    "Introduction to Rope Climbing 11/14",
    "Season pass 2024/25",
    "AC/DC - Back in Black",
    "Roadtest: Best Cars 2024",
    "Roadtest:Best",
    "Ratio 3:2",
    "Opening 9:30 am",
    "Q&A Session",
    "Tom & Jerry's {Show}",
    "C++ Programming",
    "C# Basics",
    "Section #5",
    "Node.js Guide",
    "v1.2.3 release",
    "1.5 * 2",
    "Cars. More cars",
    "...Ellipsis start",
    "Rock'n'Roll Hits",
    "It's here",
    '"Quoted" Title',
    "Price (USD) [net]",
    "Price 1,000 units",
    "50% Off!",
    "$100 deal",
    "€50 voucher",
    "user@example.com",
    "snake_case_name",
    "What? Why!",
    "Path\\to\\file",
    "a+b=c",
    "Hello~World",
    "e-mail <test>",
    "2024-25 season",
    "foo^bar",
    "x|y z",
    "Terms AND/OR conditions",
    "Rock/NOT/Roll",
    "Café Déjà vu",
    "Ölüdeniz Beach",
    "O’Reilly Media",
    "abc.123 code",
    "90's music",
    "Score 3;4",
    "東京タワー",
    "ひらがな text",
    "Escola col\u00B7legi",
    "Price 1\uFF0C000 units",
    "ひらか\u3099な decomposed"
];

/**
 * A term made only of punctuation, such as the first "." of "...Ellipsis start", has no word in it
 * to search for, so the entry is not expected to come back for it.
 */
const hasWord = (term: string) => /[\p{L}\p{N}]/u.test(term);

const prefixesOf = (name: string) => {
    return Array.from({ length: name.length }, (_, index) => name.slice(0, index + 1)).filter(
        hasWord
    );
};

describe("SDK GraphQL - CMS Search with special characters", () => {
    const { sdk } = useWebinySdk();
    const manageHandler = useGraphQLHandler({ path: "manage" });

    const createAndPublishEntry = async (values: ProductValues) => {
        const createResult = await sdk.cms.createEntry<ProductValues>({
            modelId: "product",
            data: { values },
            fields: ["id"]
        });
        await sdk.cms.publishEntryRevision({
            modelId: "product",
            revisionId: createResult.value.id!,
            fields: ["id"]
        });
    };

    const listNames = async (params: { search?: string; where?: Record<string, unknown> }) => {
        const result = await sdk.cms.listEntries<ProductValues>({
            modelId: "product",
            ...params,
            limit: 100,
            fields: ["id", "values.name"]
        });
        if (!result.isOk()) {
            return `error: ${result.error.message}`;
        }
        return result.value.data.map(item => item.values?.name);
    };

    beforeEach(async () => {
        const { group } = await setupGroupAndModels({
            manager: manageHandler,
            models: undefined
        });

        const categoryModel = createProductCategoryModel(group);
        await manageHandler.createContentModelMutation({
            data: {
                ...categoryModel,
                description: categoryModel.description || undefined,
                icon: categoryModel.icon || undefined
            }
        });

        const productModel = createProductModel(group);
        await manageHandler.createContentModelMutation({
            data: {
                ...productModel,
                description: productModel.description || undefined,
                icon: productModel.icon || undefined
            }
        });

        await createAndPublishEntry({
            name: "Unrelated product",
            sku: "OTHER-001",
            description: "Not the entry being searched for",
            price: 1
        });
    });

    it.each(names)("should keep finding %j while it is typed", async name => {
        await createAndPublishEntry({
            name,
            sku: "SKU-001",
            description: "Searched for",
            price: 1
        });

        // Every keystroke that loses the entry, so a failure lists all of them at once.
        const lost: { via: string; term: string; found: unknown }[] = [];
        for (const term of prefixesOf(name)) {
            const searched = await listNames({ search: term });
            if (!Array.isArray(searched) || !searched.includes(name)) {
                lost.push({ via: "search", term, found: searched });
            }

            const filtered = await listNames({ where: { "values.name_contains": term } });
            if (!Array.isArray(filtered) || !filtered.includes(name)) {
                lost.push({ via: "name_contains", term, found: filtered });
            }
        }

        expect(lost).toEqual([]);
    });

    it.each(names)("should not find %j once a word that is not in it is added", async name => {
        await createAndPublishEntry({
            name,
            sku: "SKU-001",
            description: "Searched for",
            price: 1
        });

        const term = `${name} zebra`;
        expect(await listNames({ search: term })).toEqual([]);
        expect(await listNames({ where: { "values.name_contains": term } })).toEqual([]);
    });
});
