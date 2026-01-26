import { beforeEach, describe, expect, it } from "vitest";
import { pageModel } from "./mocks/pageWithDynamicZonesModel";
import { setupGroupAndModels } from "../testHelpers/setup";
import { usePageManageHandler } from "../testHelpers/usePageManageHandler";
import { usePageReadHandler } from "../testHelpers/usePageReadHandler";
import { useAuthorManageHandler } from "~tests/testHelpers/useAuthorManageHandler";
import type { TestCmsModel } from "~tests/types";
import { ContextPlugin } from "@webiny/api";
import type { CmsContext, CmsEntry } from "~/types";
import {
    EntryAfterCreateEventHandler,
    EntryBeforeCreateEventHandler
} from "~/features/contentEntry/CreateEntry/events.js";
import {
    EntryAfterUpdateEventHandler,
    EntryBeforeUpdateEventHandler
} from "~/features/contentEntry/UpdateEntry/events.js";

const singularPageApiName = pageModel.singularApiName;

const withTemplateId = (data: Record<string, any>) => {
    return {
        ...data,
        content: data.content.map((obj: any) => ({ ...obj, _templateId: expect.any(String) }))
    };
};

const contentEntryQueryData = {
    content: [
        {
            text: "Simple Text #1",
            __typename: `${singularPageApiName}_Content_SimpleText`
        },
        {
            title: "Hero Title #1",
            date: "2021-01-01",
            time: "12:00:00",
            dateTimeWithTimezone: "2021-01-01T12:00:00+01:00",
            dateTimeWithoutTimezone: "2021-01-01T12:00:00.000Z",
            __typename: `${singularPageApiName}_Content_Hero`
        },
        {
            title: "Hero Title #2",
            date: "2021-02-05",
            time: "14:00:00",
            dateTimeWithTimezone: "2021-02-05T12:00:00+01:00",
            dateTimeWithoutTimezone: "2021-02-05T12:00:00.000Z",
            __typename: `${singularPageApiName}_Content_Hero`
        },
        {
            __typename: `${singularPageApiName}_Content_Objecting`,
            nestedObject: {
                __typename: `${singularPageApiName}_Content_Objecting_NestedObject`,
                objectNestedObject: [
                    {
                        nestedObjectNestedTitle: "Content Objecting nested title #1",
                        date: "2021-01-01",
                        time: "12:00:00",
                        dateTimeWithTimezone: "2021-01-01T12:00:00+01:00",
                        dateTimeWithoutTimezone: "2021-01-01T12:00:00.000Z"
                    },
                    {
                        nestedObjectNestedTitle: "Content Objecting nested title #2",
                        date: "2021-02-05",
                        time: "14:00:00",
                        dateTimeWithTimezone: "2021-02-05T12:00:00+01:00",
                        dateTimeWithoutTimezone: "2021-02-05T12:00:00.000Z"
                    }
                ],
                objectTitle: "Objective title #1"
            },
            dynamicZone: {
                __typename: `${singularPageApiName}_Content_Objecting_DynamicZone_SuperNestedObject`,
                authors: [
                    {
                        modelId: "author",
                        id: "john-doe#0001"
                    }
                ]
            }
        },
        {
            __typename: `${singularPageApiName}_Content_Author`,
            author: {
                modelId: "author",
                id: "john-doe#0001"
            },
            authors: [
                {
                    modelId: "author",
                    id: "john-doe#0001"
                }
            ]
        }
    ],
    header: {
        title: "Header #1",
        image: "https://d3bwcib4j08r73.cloudfront.net/files/webiny-serverless-cms.png",
        __typename: `${singularPageApiName}_Header_ImageHeader`
    },
    objective: {
        nestedObject: {
            objectNestedObject: [
                {
                    nestedObjectNestedTitle: "Objective nested title #1",
                    date: "2021-01-01",
                    time: "12:00:00",
                    dateTimeWithTimezone: "2021-01-01T12:00:00+01:00",
                    dateTimeWithoutTimezone: "2021-01-01T12:00:00.000Z"
                },
                {
                    nestedObjectNestedTitle: "Objective nested title #2",
                    date: "2021-02-05",
                    time: "14:00:00",
                    dateTimeWithTimezone: "2021-02-05T12:00:00+01:00",
                    dateTimeWithoutTimezone: "2021-02-05T12:00:00.000Z"
                }
            ],
            objectTitle: "Objective title #1",
            objectBody: [
                {
                    tag: "h1",
                    content: "Rich Text"
                },
                {
                    tag: "div",
                    children: [
                        {
                            tag: "p",
                            content: "Testing the rich text storage"
                        }
                    ]
                }
            ]
        },
        __typename: `${singularPageApiName}_Objective_Objecting`
    },
    reference: {
        author: {
            id: "john-doe#0001",
            modelId: "author",
            __typename: "RefField"
        },
        __typename: `${singularPageApiName}_Reference_Author`
    },
    references1: {
        authors: [
            {
                id: "john-doe#0001",
                modelId: "author",
                __typename: "RefField"
            }
        ],
        __typename: `${singularPageApiName}_References1_Authors`
    },
    references2: [
        {
            author: {
                id: "john-doe#0001",
                modelId: "author",
                __typename: "RefField"
            },
            __typename: `${singularPageApiName}_References2_Author`
        }
    ]
};

const contentEntryMutationData = {
    content: [
        {
            SimpleText: { text: "Simple Text #1" }
        },
        {
            Hero: {
                title: "Hero Title #1",
                date: "2021-01-01",
                time: "12:00:00",
                dateTimeWithTimezone: "2021-01-01T12:00:00+01:00",
                dateTimeWithoutTimezone: "2021-01-01T12:00:00.000Z"
            }
        },
        {
            Hero: {
                title: "Hero Title #2",
                date: "2021-02-05",
                time: "14:00:00",
                dateTimeWithTimezone: "2021-02-05T12:00:00+01:00",
                dateTimeWithoutTimezone: "2021-02-05T12:00:00.000Z"
            }
        },
        {
            Objecting: {
                nestedObject: {
                    objectTitle: "Objective title #1",
                    objectNestedObject: [
                        {
                            nestedObjectNestedTitle: "Content Objecting nested title #1",
                            date: "2021-01-01",
                            time: "12:00:00",
                            dateTimeWithTimezone: "2021-01-01T12:00:00+01:00",
                            dateTimeWithoutTimezone: "2021-01-01T12:00:00.000Z"
                        },
                        {
                            nestedObjectNestedTitle: "Content Objecting nested title #2",
                            date: "2021-02-05",
                            time: "14:00:00",
                            dateTimeWithTimezone: "2021-02-05T12:00:00+01:00",
                            dateTimeWithoutTimezone: "2021-02-05T12:00:00.000Z"
                        }
                    ]
                },
                dynamicZone: {
                    SuperNestedObject: {
                        authors: [
                            {
                                modelId: "author",
                                id: "john-doe#0001"
                            }
                        ]
                    }
                }
            }
        },
        {
            Author: {
                author: {
                    modelId: "author",
                    id: "john-doe#0001"
                },
                authors: [
                    {
                        modelId: "author",
                        id: "john-doe#0001"
                    }
                ]
            }
        }
    ],
    header: {
        ImageHeader: {
            title: "Header #1",
            image: "https://d3bwcib4j08r73.cloudfront.net/files/webiny-serverless-cms.png"
        }
    },
    objective: {
        Objecting: {
            nestedObject: {
                objectTitle: "Objective title #1",
                objectBody: [
                    {
                        tag: "h1",
                        content: "Rich Text"
                    },
                    {
                        tag: "div",
                        children: [
                            {
                                tag: "p",
                                content: "Testing the rich text storage"
                            }
                        ]
                    }
                ],
                objectNestedObject: [
                    {
                        nestedObjectNestedTitle: "Objective nested title #1",
                        date: "2021-01-01",
                        time: "12:00:00",
                        dateTimeWithTimezone: "2021-01-01T12:00:00+01:00",
                        dateTimeWithoutTimezone: "2021-01-01T12:00:00.000Z"
                    },
                    {
                        nestedObjectNestedTitle: "Objective nested title #2",
                        date: "2021-02-05",
                        time: "14:00:00",
                        dateTimeWithTimezone: "2021-02-05T12:00:00+01:00",
                        dateTimeWithoutTimezone: "2021-02-05T12:00:00.000Z"
                    }
                ]
            }
        }
    },
    reference: {
        Author: {
            author: {
                id: "john-doe#0001",
                modelId: "author"
            }
        }
    },
    references1: {
        Authors: {
            authors: [
                {
                    id: "john-doe#0001",
                    modelId: "author"
                }
            ]
        }
    },
    references2: [
        {
            Author: {
                author: {
                    id: "john-doe#0001",
                    modelId: "author"
                }
            }
        }
    ]
};

interface SetupAuthorParams {
    manager: ReturnType<typeof useAuthorManageHandler>;
}

const setupAuthor = async ({ manager }: SetupAuthorParams) => {
    const [authorResponse] = await manager.createAuthor({
        data: {
            id: "john-doe",
            values: {
                fullName: "John Doe"
            }
        }
    });

    const [authorPublishResponse] = await manager.publishAuthor({
        revision: authorResponse.data.createAuthor.data.id
    });

    return authorPublishResponse.data.publishAuthor.data;
};

type Values = {
    content: Array<{ _templateId: string }>;
};

describe("dynamicZone field", () => {
    const manageOpts = { path: "manage" };
    const previewOpts = { path: "preview" };

    const eventEntryContent: {
        beforeCreate: CmsEntry<Values> | undefined;
        afterCreate: CmsEntry<Values> | undefined;
        beforeUpdate: CmsEntry<Values> | undefined;
        afterUpdate: CmsEntry<Values> | undefined;
    } = {
        beforeCreate: undefined,
        afterCreate: undefined,
        beforeUpdate: undefined,
        afterUpdate: undefined
    };

    const lifecycleEvents = new ContextPlugin<CmsContext>(async (context: CmsContext) => {
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }

        context.container.registerFactory(EntryBeforeCreateEventHandler, () => ({
            async handle(event) {
                eventEntryContent.beforeCreate = structuredClone(
                    event.payload.entry
                ) as CmsEntry<Values>;
            }
        }));

        context.container.registerFactory(EntryAfterCreateEventHandler, () => ({
            async handle(event) {
                eventEntryContent.afterCreate = structuredClone(
                    event.payload.entry
                ) as CmsEntry<Values>;
            }
        }));

        context.container.registerFactory(EntryBeforeUpdateEventHandler, () => ({
            async handle(event) {
                eventEntryContent.beforeUpdate = structuredClone(
                    event.payload.entry
                ) as CmsEntry<Values>;
            }
        }));

        context.container.registerFactory(EntryAfterUpdateEventHandler, () => ({
            async handle(event) {
                eventEntryContent.afterUpdate = structuredClone(
                    event.payload.entry
                ) as CmsEntry<Values>;
            }
        }));
    });

    const manage = usePageManageHandler({ ...manageOpts, bottomPlugins: [lifecycleEvents] });

    const authorManager = useAuthorManageHandler({
        ...manageOpts
    });

    beforeEach(async () => {
        await setupGroupAndModels({
            manager: manage,
            models: ["author", pageModel as unknown as TestCmsModel]
        });
        await setupAuthor({
            manager: authorManager
        });
    });

    it("should create a page with dynamic zone fields", async () => {
        const [createPageResponse] = await manage.createPage({
            data: {
                values: contentEntryMutationData
            }
        });

        expect(createPageResponse).toEqual({
            data: {
                createPage: {
                    data: {
                        id: expect.any(String),
                        values: {
                            ...withTemplateId(contentEntryQueryData)
                        }
                    },
                    error: null
                }
            }
        });

        const [updatePageResponse] = await manage.updatePage({
            revision: createPageResponse.data.createPage.data.id,
            data: {
                values: contentEntryMutationData
            }
        });

        expect(updatePageResponse).toEqual({
            data: {
                updatePage: {
                    data: {
                        id: expect.any(String),
                        values: {
                            ...withTemplateId(contentEntryQueryData)
                        }
                    },
                    error: null
                }
            }
        });

        const page = createPageResponse.data.createPage.data;

        const [manageList] = await manage.listPages();

        expect(manageList).toEqual({
            data: {
                listPages: {
                    data: [
                        {
                            id: page.id,
                            values: {
                                ...withTemplateId(contentEntryQueryData)
                            }
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        // Test `manage` get
        const [manageGet] = await manage.getPage({
            revision: page.id
        });

        expect(manageGet).toEqual({
            data: {
                getPage: {
                    data: {
                        id: page.id,
                        values: {
                            ...withTemplateId(contentEntryQueryData)
                        }
                    },
                    error: null
                }
            }
        });

        const preview = usePageReadHandler(previewOpts);

        // Test `read` get
        const previewGet = await preview
            .getPage({
                where: {
                    id: page.id
                }
            })
            .then(([data]) => data);

        expect(previewGet).toEqual({
            data: {
                getPage: {
                    data: {
                        id: page.id,
                        values: {
                            ...contentEntryQueryData,
                            content: [
                                ...contentEntryQueryData.content.slice(0, 3),
                                {
                                    ...contentEntryQueryData.content[3],
                                    dynamicZone: {
                                        authors: [
                                            {
                                                entryId: "john-doe",
                                                id: "john-doe#0001",
                                                modelId: "author",
                                                values: {
                                                    fullName: "John Doe"
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    __typename: contentEntryQueryData.content[4].__typename,
                                    author: {
                                        entryId: "john-doe",
                                        id: "john-doe#0001",
                                        modelId: "author",
                                        values: {
                                            fullName: "John Doe"
                                        }
                                    },
                                    authors: [
                                        {
                                            entryId: "john-doe",
                                            id: "john-doe#0001",
                                            modelId: "author",
                                            values: {
                                                fullName: "John Doe"
                                            }
                                        }
                                    ]
                                }
                            ],
                            reference: {
                                author: {
                                    entryId: "john-doe",
                                    id: "john-doe#0001",
                                    modelId: "author",
                                    values: {
                                        fullName: "John Doe"
                                    }
                                }
                            },
                            references1: {
                                authors: [
                                    {
                                        entryId: "john-doe",
                                        id: "john-doe#0001",
                                        modelId: "author",
                                        values: {
                                            fullName: "John Doe"
                                        }
                                    }
                                ]
                            },
                            references2: [
                                {
                                    author: {
                                        entryId: "john-doe",
                                        id: "john-doe#0001",
                                        modelId: "author",
                                        values: {
                                            fullName: "John Doe"
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    error: null
                }
            }
        });

        const tplIsConverted = <T extends object>(tpl: T) => "_templateId" in tpl;

        expect(eventEntryContent.beforeCreate?.values.content.every(tplIsConverted)).toEqual(true);
        expect(eventEntryContent.afterCreate?.values.content.every(tplIsConverted)).toEqual(true);
        expect(eventEntryContent.beforeUpdate?.values.content.every(tplIsConverted)).toEqual(true);
        expect(eventEntryContent.afterUpdate?.values.content.every(tplIsConverted)).toEqual(true);
    });
});
