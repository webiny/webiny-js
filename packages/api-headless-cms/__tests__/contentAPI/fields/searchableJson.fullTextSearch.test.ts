import { beforeEach, describe, expect, it } from "vitest";
import { createAuthorWithSearchableJsonContextHandler } from "~tests/__helpers/handler/authorWithSearchableJson/context.js";
import type { IAuthorWithSearchableJsonCmsEntryValues } from "~tests/__helpers/models/authorWithSearchableJson.js";
import { AUTHOR_WITH_SEARCHABLE_JSON_MODEL_ID } from "~tests/__helpers/models/authorWithSearchableJson.js";
import type { CmsContext, CmsModel } from "~/types/index.js";

interface ValueTypeCase {
    type: string;
    summer: Record<string, any>;
    winter: Record<string, any>;
}

/**
 * Values stored in the searchable-json field are dynamically mapped by OpenSearch.
 * Non-text values (dates, numbers, booleans) get non-text mappings, and wildcard queries
 * are not allowed on those. Full-text search must not break because of it.
 *
 * Each case contains only one non-text value type, so each type is verified on its own.
 */
const valueTypeCases: ValueTypeCase[] = [
    {
        type: "date",
        summer: {
            activeTo: "2026-08-31T23:59:59.000Z",
            address: { validUntil: "2027-01-01T00:00:00.000Z" }
        },
        winter: {
            activeTo: "2027-02-28T23:59:59.000Z",
            address: { validUntil: "2027-06-01T00:00:00.000Z" }
        }
    },
    {
        type: "integer",
        summer: {
            priority: 1,
            address: { zip: 10000 }
        },
        winter: {
            priority: 2,
            address: { zip: 20000 }
        }
    },
    {
        type: "float",
        summer: {
            discount: 0.15,
            address: { latitude: 45.815 }
        },
        winter: {
            discount: 0.25,
            address: { latitude: 46.305 }
        }
    },
    {
        type: "boolean",
        summer: {
            active: true,
            address: { verified: false }
        },
        winter: {
            active: false,
            address: { verified: true }
        }
    },
    {
        type: "array",
        summer: {
            dates: ["2026-06-01T00:00:00.000Z", "2026-07-01T00:00:00.000Z"],
            integers: [1, 2],
            floats: [1.5, 2.5],
            flags: [true, false],
            periods: [{ from: "2026-06-01T00:00:00.000Z", count: 1, open: true }]
        },
        winter: {
            dates: ["2026-12-01T00:00:00.000Z", "2027-01-01T00:00:00.000Z"],
            integers: [3, 4],
            floats: [3.5, 4.5],
            flags: [false, true],
            periods: [{ from: "2026-12-01T00:00:00.000Z", count: 2, open: false }]
        }
    },
    {
        type: "mixed",
        summer: {
            activeTo: "2026-08-31T23:59:59.000Z",
            priority: 1,
            discount: 0.15,
            active: true,
            tags: ["beach", "sun"],
            periods: [{ from: "2026-06-01T00:00:00.000Z", count: 1, open: true }],
            address: {
                validUntil: "2027-01-01T00:00:00.000Z",
                zip: 10000,
                latitude: 45.815,
                verified: false,
                geo: { updatedOn: "2026-01-01T00:00:00.000Z", precision: 3, exact: true }
            }
        },
        winter: {
            activeTo: "2027-02-28T23:59:59.000Z",
            priority: 2,
            discount: 0.25,
            active: false,
            tags: ["snow", "ski"],
            periods: [{ from: "2026-12-01T00:00:00.000Z", count: 2, open: false }],
            address: {
                validUntil: "2027-06-01T00:00:00.000Z",
                zip: 20000,
                latitude: 46.305,
                verified: true,
                geo: { updatedOn: "2026-02-01T00:00:00.000Z", precision: 5, exact: false }
            }
        }
    }
];

describe.each(valueTypeCases)(
    "searchable-json field - full text search with $type values",
    ({ summer, winter }) => {
        let context: CmsContext;
        let model: CmsModel;

        beforeEach(async () => {
            const contextHandler = createAuthorWithSearchableJsonContextHandler();
            context = await contextHandler.handler();

            model = await context.cms.getModel(AUTHOR_WITH_SEARCHABLE_JSON_MODEL_ID);

            await context.cms.createEntry<IAuthorWithSearchableJsonCmsEntryValues>(model, {
                values: {
                    name: "John Doe",
                    info: {
                        ...summer,
                        title: "Summer campaign",
                        address: {
                            ...summer.address,
                            city: "Anytown"
                        }
                    }
                }
            });
            await context.cms.createEntry<IAuthorWithSearchableJsonCmsEntryValues>(model, {
                values: {
                    name: "Jacob Doe",
                    info: {
                        ...winter,
                        title: "Winter campaign",
                        address: {
                            ...winter.address,
                            city: "Othertown"
                        }
                    }
                }
            });
        });

        const search = async (term: string) => {
            const [entries] =
                await context.cms.listLatestEntries<IAuthorWithSearchableJsonCmsEntryValues>(
                    model,
                    {
                        search: term
                    }
                );
            return entries.map(entry => entry.values.name).sort();
        };

        it("should find entries by a text value in the searchable-json field", async () => {
            expect(await search("Summer")).toEqual(["John Doe"]);
            expect(await search("campaign")).toEqual(["Jacob Doe", "John Doe"]);
        });

        it("should find entries by a nested text value in the searchable-json field", async () => {
            expect(await search("Othertown")).toEqual(["Jacob Doe"]);
        });

        it("should find entries by the title field", async () => {
            expect(await search("Jacob")).toEqual(["Jacob Doe"]);
        });

        it("should find nothing when term does not match", async () => {
            expect(await search("Autumn")).toEqual([]);
        });
    }
);
