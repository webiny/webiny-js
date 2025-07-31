import { createAuthorWithSearchableJsonContextHandler } from "~tests/__helpers/handler/authorWithSearchableJson/context.js";
import type { IAuthorWithSearchableJsonCmsEntryValues } from "~tests/__helpers/models/authorWithSearchableJson.js";
import { AUTHOR_WITH_SEARCHABLE_JSON_MODEL_ID } from "~tests/__helpers/models/authorWithSearchableJson.js";
import type { CmsContext, CmsEntry, CmsModel } from "~/types/index.js";
import { useAuthorWithSearchableJsonReader } from "~tests/__helpers/handler/authorWithSearchableJson/reader";

describe("searchable-json field - read - author", () => {
    const reader = useAuthorWithSearchableJsonReader();

    const values: IAuthorWithSearchableJsonCmsEntryValues = Object.freeze({
        name: "John Doe",
        info: {
            age: 30,
            hobbies: ["reading", "gaming"],
            address: {
                street: "123 Main St",
                city: "Anytown",
                country: "Country"
            }
        }
    });

    let context: CmsContext;
    let model: CmsModel;
    let entry: CmsEntry<IAuthorWithSearchableJsonCmsEntryValues>;
    /**
     *
     */
    beforeEach(async () => {
        const contextHandler = createAuthorWithSearchableJsonContextHandler();
        context = await contextHandler.handler();

        model = await context.cms.getModel(AUTHOR_WITH_SEARCHABLE_JSON_MODEL_ID);

        const createdEntry = await context.cms.createEntry<IAuthorWithSearchableJsonCmsEntryValues>(
            model,
            values
        );
        entry = await context.cms.publishEntry<IAuthorWithSearchableJsonCmsEntryValues>(
            model,
            createdEntry.id
        );
    });

    it("should have an entry with searchable-json field", async () => {
        expect(entry).toMatchObject({
            id: expect.stringMatching(/^([a-zA-Z0-9]+)#0001$/),
            values
        });
        expect(entry.values).toEqual(values);

        const getEntryResult = await context.cms.getEntryById(model, entry.id);
        expect(getEntryResult).toMatchObject({
            id: entry.id,
            values
        });

        const [listLatestEntriesResult] = await context.cms.listLatestEntries(model);
        expect(listLatestEntriesResult[0]).toMatchObject({
            id: entry.id,
            values
        });

        const [listPublishedEntriesResult] = await context.cms.listPublishedEntries(model);
        expect(listPublishedEntriesResult[0]).toMatchObject({
            id: entry.id,
            values
        });
    });

    /**
     * Unknown
     */
    it("should find nothing because subfield does not exist", async () => {
        const [searchUnknownResult] = await reader.listAuthors({
            where: {
                info: {
                    unknownId: "value"
                }
            }
        });
        expect(searchUnknownResult.data.content.data).toHaveLength(0);
    });

    it.skip("should find entry because subfield does not exist - negate", async () => {
        const [searchUnknownNotResult] = await reader.listAuthors({
            where: {
                info: {
                    unknownId_not: "value"
                }
            }
        });
        expect(searchUnknownNotResult.data.content.data).toHaveLength(1);
        expect(searchUnknownNotResult.data.content.data[0].name).toBe("John Doe");
    });
    /**
     * Name
     */
    it("should use name to search for an entry - equal", async () => {
        const [searchNameResult] = await reader.listAuthors({
            where: {
                name: "John Doe"
            }
        });
        expect(searchNameResult.data.content.data).toHaveLength(1);
        expect(searchNameResult.data.content.data[0].name).toBe("John Doe");

        const [searchNameFailResult] = await reader.listAuthors({
            where: {
                name: "Jane Doe"
            }
        });
        expect(searchNameFailResult.data.content.data).toHaveLength(0);
    });

    it("should use name to search for an entry - not_equal", async () => {
        const [searchNameFailResult] = await reader.listAuthors({
            where: {
                name_not: "John Doe"
            }
        });
        expect(searchNameFailResult.data.content.data).toHaveLength(0);

        const [searchNameResult] = await reader.listAuthors({
            where: {
                name_not: "Jane Doe"
            }
        });
        expect(searchNameResult.data.content.data).toHaveLength(1);
        expect(searchNameResult.data.content.data[0].name).toBe("John Doe");
    });

    it("should use name to search for an entry - contains", async () => {
        const [searchNameResult] = await reader.listAuthors({
            where: {
                name_contains: "John"
            }
        });
        expect(searchNameResult.data.content.data).toHaveLength(1);
        expect(searchNameResult.data.content.data[0].name).toBe("John Doe");

        const [searchNameFailResult] = await reader.listAuthors({
            where: {
                name_contains: "Jane"
            }
        });
        expect(searchNameFailResult.data.content.data).toHaveLength(0);
    });

    it("should use name to search for an entry - not_contains", async () => {
        const [searchNameFailResult] = await reader.listAuthors({
            where: {
                name_not_contains: "John"
            }
        });
        expect(searchNameFailResult.data.content.data).toHaveLength(0);

        const [searchNameResult] = await reader.listAuthors({
            where: {
                name_not_contains: "Jane"
            }
        });
        expect(searchNameResult.data.content.data).toHaveLength(1);
        expect(searchNameResult.data.content.data[0].name).toBe("John Doe");
    });
    /**
     * Info.Age
     */

    it("should use info.age to search for an entry - equal", async () => {
        const [searchAgeResult] = await reader.listAuthors({
            where: {
                info: {
                    age: 30
                }
            }
        });
        expect(searchAgeResult.data.content.data).toHaveLength(1);
        expect(searchAgeResult.data.content.data[0].name).toBe("John Doe");

        const [searchAgeFailResult] = await reader.listAuthors({
            where: {
                info: {
                    age: 31
                }
            }
        });
        expect(searchAgeFailResult.data.content.data).toHaveLength(0);
    });

    it.skip("should use info.age to search for an entry - not_equal", async () => {
        const [searchAgeFailResult] = await reader.listAuthors({
            where: {
                info: {
                    age_not: 30
                }
            }
        });
        expect(searchAgeFailResult.data.content.data).toHaveLength(0);

        const [searchAgeResult] = await reader.listAuthors({
            where: {
                info: {
                    age_not: 31
                }
            }
        });

        expect(searchAgeResult.data.content.data).toHaveLength(1);
        expect(searchAgeResult.data.content.data[0].name).toBe("John Doe");
    });

    it.skip("should use info.age to search for an entry - gte", async () => {
        const [searchAgeResult] = await reader.listAuthors({
            where: {
                info: {
                    age_gte: 30
                }
            }
        });
        expect(searchAgeResult.data.content.data).toHaveLength(1);
        expect(searchAgeResult.data.content.data[0].name).toBe("John Doe");

        const [searchAgeFailResult] = await reader.listAuthors({
            where: {
                info: {
                    age_gte: 31
                }
            }
        });
        expect(searchAgeFailResult.data.content.data).toHaveLength(0);
    });

    it.skip("should use info.age to search for an entry - lte", async () => {
        const [searchAgeResult] = await reader.listAuthors({
            where: {
                info: {
                    age_lte: 30
                }
            }
        });
        expect(searchAgeResult.data.content.data).toHaveLength(1);
        expect(searchAgeResult.data.content.data[0].name).toBe("John Doe");

        const [searchAgeFailResult] = await reader.listAuthors({
            where: {
                info: {
                    age_lte: 29
                }
            }
        });
        expect(searchAgeFailResult.data.content.data).toHaveLength(0);
    });
    /**
     * Info.Hobbies
     */
    it("should use info.hobbies to search for an entry - equal", async () => {
        const [searchHobbiesResult] = await reader.listAuthors({
            where: {
                info: {
                    hobbies: "reading"
                }
            }
        });
        expect(searchHobbiesResult.data.content.data).toHaveLength(1);
        expect(searchHobbiesResult.data.content.data[0].name).toBe("John Doe");

        const [searchHobbiesFailResult] = await reader.listAuthors({
            where: {
                info: {
                    hobbies: "swimming"
                }
            }
        });
        expect(searchHobbiesFailResult.data.content.data).toHaveLength(0);
    });
    /**
     * Info.Address.Street
     */
    it.skip("should use info.address.street to search for an entry - equal", async () => {
        const [searchStreetResult] = await reader.listAuthors({
            where: {
                info: {
                    address: {
                        street: "123 Main St"
                    }
                }
            }
        });
        expect(searchStreetResult.data.content.data).toHaveLength(1);
        expect(searchStreetResult.data.content.data[0].name).toBe("John Doe");

        const [searchStreetFailResult] = await reader.listAuthors({
            where: {
                info: {
                    address: {
                        street: "456 Elm St"
                    }
                }
            }
        });
        expect(searchStreetFailResult.data.content.data).toHaveLength(0);
    });

    it.skip("should use info.address.street to search for an entry - not_equal", async () => {
        const [searchStreetFailResult] = await reader.listAuthors({
            where: {
                info: {
                    address: {
                        street_not: "123 Main St"
                    }
                }
            }
        });
        expect(searchStreetFailResult.data.content.data).toHaveLength(0);

        const [searchStreetResult] = await reader.listAuthors({
            where: {
                info: {
                    address: {
                        street_not: "456 Elm St"
                    }
                }
            }
        });
        expect(searchStreetResult.data.content.data).toHaveLength(1);
        expect(searchStreetResult.data.content.data[0].name).toBe("John Doe");
    });

    it.skip("should use info.address.street to search for an entry - contains", async () => {
        const [searchStreetResult] = await reader.listAuthors({
            where: {
                info: {
                    address: {
                        street_contains: "Main"
                    }
                }
            }
        });
        expect(searchStreetResult.data.content.data).toHaveLength(1);
        expect(searchStreetResult.data.content.data[0].name).toBe("John Doe");

        const [searchStreetFailResult] = await reader.listAuthors({
            where: {
                info: {
                    address: {
                        street_contains: "Elm"
                    }
                }
            }
        });
        expect(searchStreetFailResult.data.content.data).toHaveLength(0);
    });

    it.skip("should use info.address.street to search for an entry - not_contains", async () => {
        const [searchStreetFailResult] = await reader.listAuthors({
            where: {
                info: {
                    address: {
                        street_not_contains: "Main"
                    }
                }
            }
        });
        expect(searchStreetFailResult.data.content.data).toHaveLength(0);

        const [searchStreetResult] = await reader.listAuthors({
            where: {
                info: {
                    address: {
                        street_not_contains: "Elm"
                    }
                }
            }
        });
        expect(searchStreetResult.data.content.data).toHaveLength(1);
        expect(searchStreetResult.data.content.data[0].name).toBe("John Doe");
    });
});
