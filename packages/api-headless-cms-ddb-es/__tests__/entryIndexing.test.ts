import { PluginsContainer } from "@webiny/plugins";
import indexingPlugins from "~/elasticsearch/indexing";
import { createGraphQLFields } from "@webiny/api-headless-cms";
import { CmsEntry } from "@webiny/api-headless-cms/types";
import { extractEntriesFromIndex, prepareEntryToIndex } from "~/helpers";

const mockRichTextValue = [
    {
        tag: "p",
        content: "some long text"
    }
];

const mockTextValue = "some short searchable text";

const mockModel: any = {
    fields: [
        {
            storageId: "notAffectedNumber",
            type: "number"
        },
        {
            storageId: "notAffectedString",
            type: "text"
        },
        {
            storageId: "richText",
            type: "rich-text"
        },
        {
            storageId: "text",
            type: "text"
        },
        {
            storageId: "page",
            type: "object",
            settings: {
                fields: [
                    {
                        storageId: "title",
                        type: "text"
                    },
                    {
                        storageId: "number",
                        type: "number"
                    },
                    {
                        storageId: "richText",
                        type: "rich-text"
                    },
                    {
                        storageId: "settings",
                        type: "object",
                        settings: {
                            fields: [
                                {
                                    storageId: "title",
                                    type: "text"
                                },
                                {
                                    storageId: "snippet",
                                    type: "rich-text"
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ]
};

const mockInputEntry: Partial<CmsEntry> = {
    values: {
        notAffectedNumber: 1,
        notAffectedString: "some text",
        richText: mockRichTextValue,
        text: mockTextValue,
        page: {
            title: "Title",
            number: 155.75,
            richText: [
                {
                    tag: "p",
                    content: "full"
                }
            ],
            settings: {
                title: "Settings Title",
                snippet: [
                    {
                        tag: "p",
                        content: "snippet"
                    }
                ]
            }
        }
    }
};

const mockIndexedEntry: Partial<CmsEntry> & Record<string, any> = {
    values: {
        notAffectedNumber: 1,
        notAffectedString: "some text",
        text: mockTextValue,
        page: {
            title: "Title",
            number: 155.75,
            settings: {
                title: "Settings Title"
            }
        }
    },
    rawValues: {
        richText: mockRichTextValue,
        page: {
            richText: [
                {
                    tag: "p",
                    content: "full"
                }
            ],
            settings: {
                snippet: [
                    {
                        tag: "p",
                        content: "snippet"
                    }
                ]
            }
        }
    }
};

const plugins = new PluginsContainer([...indexingPlugins(), ...createGraphQLFields()]);

describe("entryIndexing", () => {
    test("should prepare entry for indexing", () => {
        const entryToIndex = prepareEntryToIndex({
            entry: mockInputEntry as any,
            storageEntry: mockInputEntry as any,
            model: mockModel,
            plugins
        });

        expect(entryToIndex).toEqual(mockIndexedEntry);
    });

    test("should extract original entry from indexed data", () => {
        const [entryFromIndex] = extractEntriesFromIndex({
            model: mockModel,
            plugins,
            entries: [mockIndexedEntry as any]
        });

        expect(entryFromIndex.values).toEqual(mockInputEntry.values);
    });
});
