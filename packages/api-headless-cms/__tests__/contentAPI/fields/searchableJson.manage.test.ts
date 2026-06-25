import { HeadlessCms } from "~/features/shared/abstractions.js";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthorWithSearchableJsonContextHandler } from "~tests/__helpers/handler/authorWithSearchableJson/context.js";
import type { IAuthorWithSearchableJsonCmsEntryValues } from "~tests/__helpers/models/authorWithSearchableJson.js";
import { AUTHOR_WITH_SEARCHABLE_JSON_MODEL_ID } from "~tests/__helpers/models/authorWithSearchableJson.js";
import { useAuthorWithSearchableJsonManager } from "~tests/__helpers/handler/authorWithSearchableJson/manager.js";
import type { CmsContext, CmsEntry, CmsModel } from "~/types/index.js";

const johnDoeValues: IAuthorWithSearchableJsonCmsEntryValues = Object.freeze({
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

const jacobDoeValues = Object.freeze({
    name: "Jacob Doe",
    info: {
        age: 25,
        hobbies: ["swimming", "gaming"],
        address: {
            street: "456 Elm St",
            city: "Othertown",
            country: "Country"
        }
    }
});

describe("searchable-json field - manage - author", () => {
    const manager = useAuthorWithSearchableJsonManager();

    let context: CmsContext;
    let model: CmsModel;
    let johnDoeEntry: CmsEntry<IAuthorWithSearchableJsonCmsEntryValues>;
    let jacobDoeEntry: CmsEntry<IAuthorWithSearchableJsonCmsEntryValues>;
    /**
     *
     */
    beforeEach(async () => {
        const contextHandler = createAuthorWithSearchableJsonContextHandler();
        context = await contextHandler.handler();

        model = await context.container
            .resolve(HeadlessCms)
            .getModel(AUTHOR_WITH_SEARCHABLE_JSON_MODEL_ID);

        johnDoeEntry = await context.container
            .resolve(HeadlessCms)
            .createEntry<IAuthorWithSearchableJsonCmsEntryValues>(model, {
                values: johnDoeValues
            });

        jacobDoeEntry = await context.container
            .resolve(HeadlessCms)
            .createEntry<IAuthorWithSearchableJsonCmsEntryValues>(model, {
                values: jacobDoeValues
            });
    });

    it("should have an entry with searchable-json field", async () => {
        expect(johnDoeEntry).toMatchObject({
            id: expect.stringMatching(/^([a-zA-Z0-9]+)#0001$/),
            values: johnDoeValues
        });
        expect(johnDoeEntry.values).toEqual(johnDoeValues);

        const getEntryResult = await context.container
            .resolve(HeadlessCms)
            .getEntryById(model, johnDoeEntry.id);
        expect(getEntryResult).toMatchObject({
            id: johnDoeEntry.id,
            values: johnDoeValues
        });

        const [listEntriesResult] = await context.container
            .resolve(HeadlessCms)
            .listLatestEntries(model);
        expect(listEntriesResult[0]).toMatchObject({
            id: jacobDoeEntry.id,
            values: jacobDoeValues
        });
        expect(listEntriesResult[1]).toMatchObject({
            id: johnDoeEntry.id,
            values: johnDoeValues
        });
    });

    /**
     * Unknown
     */
    it("should find nothing because subfield does not exist", async () => {
        const [searchUnknownResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        unknownId: "value"
                    }
                }
            }
        });
        expect(searchUnknownResult.errors).toBeUndefined();
        expect(searchUnknownResult.data.content.error).toBeNull();
        expect(searchUnknownResult.data.content.data).toHaveLength(0);
    });

    it.skip("should find entry because subfield does not exist - negate", async () => {
        const [searchUnknownNotResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        unknownId_not: "value"
                    }
                }
            }
        });
        expect(searchUnknownNotResult.data.content.error).toBeNull();
        expect(searchUnknownNotResult.data.content.data).toHaveLength(2);
        expect(searchUnknownNotResult.data.content.data[0].values.name).toBe("Jacob Doe");
        expect(searchUnknownNotResult.data.content.data[1].values.name).toBe("John Doe");
    });
    /**
     * Name
     */
    it("should use name to search for an entry - equal", async () => {
        const [searchNameResult] = await manager.listAuthors({
            where: {
                values: {
                    name: "John Doe"
                }
            }
        });
        expect(searchNameResult.data.content.data).toHaveLength(1);
        expect(searchNameResult.data.content.data[0].values.name).toBe("John Doe");

        const [searchNameFailResult] = await manager.listAuthors({
            where: {
                values: {
                    name: "Jane Doe"
                }
            }
        });
        expect(searchNameFailResult.data.content.data).toHaveLength(0);
    });

    it("should use name to search for an entry - not_equal", async () => {
        const [searchNameFailResult] = await manager.listAuthors({
            where: {
                values: {
                    name_not: "John Doe"
                }
            }
        });
        expect(searchNameFailResult.data.content.data).toHaveLength(1);
        expect(searchNameFailResult.data.content.data[0].values.name).toBe(jacobDoeValues.name);

        const [searchNameResult] = await manager.listAuthors({
            where: {
                values: {
                    name_not: "Jane Doe"
                }
            }
        });
        expect(searchNameResult.data.content.data).toHaveLength(2);
        expect(searchNameResult.data.content.data[0].values.name).toBe(jacobDoeValues.name);
        expect(searchNameResult.data.content.data[1].values.name).toBe(johnDoeValues.name);
    });

    it("should use name to search for an entry - contains", async () => {
        const [searchNameResult] = await manager.listAuthors({
            where: {
                values: {
                    name_contains: "John"
                }
            }
        });
        expect(searchNameResult.data.content.data).toHaveLength(1);
        expect(searchNameResult.data.content.data[0].values.name).toBe("John Doe");

        const [searchNameFailResult] = await manager.listAuthors({
            where: {
                values: {
                    name_contains: "Jane"
                }
            }
        });
        expect(searchNameFailResult.data.content.data).toHaveLength(0);
    });

    it("should use name to search for an entry - not_contains", async () => {
        const [searchNameFailResult] = await manager.listAuthors({
            where: {
                values: {
                    name_not_contains: "John"
                }
            }
        });
        expect(searchNameFailResult.data.content.data).toHaveLength(1);
        expect(searchNameFailResult.data.content.data[0].values.name).toBe(jacobDoeValues.name);

        const [searchNameResult] = await manager.listAuthors({
            where: {
                values: {
                    name_not_contains: "Jane"
                }
            }
        });
        expect(searchNameResult.data.content.data).toHaveLength(2);
        expect(searchNameResult.data.content.data[0].values.name).toBe(jacobDoeValues.name);
        expect(searchNameResult.data.content.data[1].values.name).toBe(johnDoeValues.name);
    });
    /**
     * Info.Age
     */

    it("should use info.age to search for an entry - equal", async () => {
        const [searchAgeResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        age: 30
                    }
                }
            }
        });
        expect(searchAgeResult.data.content.data).toHaveLength(1);
        expect(searchAgeResult.data.content.data[0].values.name).toBe("John Doe");

        const [searchAgeFailResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        age: 31
                    }
                }
            }
        });
        expect(searchAgeFailResult.data.content.data).toHaveLength(0);
    });

    it.skip("should use info.age to search for an entry - not_equal", async () => {
        const [searchAgeFailResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        age_not: 30
                    }
                }
            }
        });
        expect(searchAgeFailResult.data.content.data).toHaveLength(1);
        expect(searchAgeFailResult.data.content.data[0].values.name).toBe(jacobDoeValues.name);

        const [searchAgeResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        age_not: 31
                    }
                }
            }
        });

        expect(searchAgeResult.data.content.data).toHaveLength(2);
        expect(searchAgeResult.data.content.data[0].values.name).toBe(jacobDoeValues.name);
        expect(searchAgeResult.data.content.data[1].values.name).toBe(johnDoeValues.name);
    });

    it.skip("should use info.age to search for an entry - gte", async () => {
        const [searchAgeResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        age_gte: 30
                    }
                }
            }
        });
        expect(searchAgeResult.data.content.data).toHaveLength(1);
        expect(searchAgeResult.data.content.data[0].values.name).toBe("John Doe");

        const [searchAgeFailResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        age_gte: 31
                    }
                }
            }
        });
        expect(searchAgeFailResult.data.content.data).toHaveLength(0);
    });

    it.skip("should use info.age to search for an entry - lte", async () => {
        const [searchAgeResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        age_lte: 30
                    }
                }
            }
        });
        expect(searchAgeResult.data.content.data).toHaveLength(2);
        expect(searchAgeResult.data.content.data[0].values.name).toBe(jacobDoeValues.name);
        expect(searchAgeResult.data.content.data[1].values.name).toBe(johnDoeValues.name);

        const [searchAgeFailResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        age_lte: 29
                    }
                }
            }
        });
        expect(searchAgeFailResult.data.content.data).toHaveLength(1);
        expect(searchAgeResult.data.content.data[0].values.name).toBe(jacobDoeValues.name);
    });
    /**
     * Info.Hobbies
     */
    it("should use info.hobbies to search for an entry - equal", async () => {
        const [searchHobbiesResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        hobbies: "reading"
                    }
                }
            }
        });
        expect(searchHobbiesResult.data.content.data).toHaveLength(1);
        expect(searchHobbiesResult.data.content.data[0].values.name).toBe("John Doe");

        const [searchHobbiesFailResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        hobbies: "swimming"
                    }
                }
            }
        });
        expect(searchHobbiesFailResult.data.content.data).toHaveLength(1);
        expect(searchHobbiesFailResult.data.content.data[0].values.name).toBe(jacobDoeValues.name);
    });
    /**
     * Info.Address.Street
     */
    it.skip("should use info.address.street to search for an entry - equal", async () => {
        const [searchStreetResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        address: {
                            street: "123 Main St"
                        }
                    }
                }
            }
        });
        expect(searchStreetResult.data.content.data).toHaveLength(1);
        expect(searchStreetResult.data.content.data[0].values.name).toBe("John Doe");

        const [searchStreetFailResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        address: {
                            street: "456 Elm St"
                        }
                    }
                }
            }
        });
        expect(searchStreetFailResult.data.content.data).toHaveLength(1);
        expect(searchStreetFailResult.data.content.data[0].values.name).toBe(jacobDoeValues.name);
    });

    it.skip("should use info.address.street to search for an entry - not_equal", async () => {
        const [searchStreetFailResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        address: {
                            street_not: "123 Main St"
                        }
                    }
                }
            }
        });
        expect(searchStreetFailResult.data.content.data).toHaveLength(1);
        expect(searchStreetFailResult.data.content.data[0].values.name).toBe(jacobDoeValues.name);

        const [searchStreetResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        address: {
                            street_not: "456 Elm St"
                        }
                    }
                }
            }
        });
        expect(searchStreetResult.data.content.data).toHaveLength(1);
        expect(searchStreetResult.data.content.data[0].values.name).toBe("John Doe");
    });

    it.skip("should use info.address.street to search for an entry - contains", async () => {
        const [searchStreetResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        address: {
                            street_contains: "Main"
                        }
                    }
                }
            }
        });
        expect(searchStreetResult.data.content.data).toHaveLength(1);
        expect(searchStreetResult.data.content.data[0].values.name).toBe("John Doe");

        const [searchStreetFailResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        address: {
                            street_contains: "Elm"
                        }
                    }
                }
            }
        });
        expect(searchStreetFailResult.data.content.data).toHaveLength(1);
        expect(searchStreetFailResult.data.content.data[0].values.name).toBe(jacobDoeValues.name);
    });

    it.skip("should use info.address.street to search for an entry - not_contains", async () => {
        const [searchStreetFailResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        address: {
                            street_not_contains: "Main"
                        }
                    }
                }
            }
        });
        expect(searchStreetFailResult.data.content.data).toHaveLength(1);
        expect(searchStreetFailResult.data.content.data[0].values.name).toBe(jacobDoeValues.name);

        const [searchStreetResult] = await manager.listAuthors({
            where: {
                values: {
                    info: {
                        address: {
                            street_not_contains: "Elm"
                        }
                    }
                }
            }
        });
        expect(searchStreetResult.data.content.data).toHaveLength(1);
        expect(searchStreetResult.data.content.data[0].values.name).toBe("John Doe");
    });
});
