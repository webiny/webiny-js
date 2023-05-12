import defaultFieldIndexPlugin from "~/elasticsearch/indexing/defaultFieldIndexing";
import { createGraphQLFields } from "@webiny/api-headless-cms";
import { CmsEntry, CmsModel, CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { PluginsContainer } from "@webiny/plugins/PluginsContainer";
import { CmsModelFieldToElasticsearchPlugin } from "~/types";

const mockRichTextValue = [
    {
        tag: "p",
        content: "some long text"
    }
];

const mockTextValue = "some short searchable text";

const mockModel = {
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
        }
    ]
} as unknown as CmsModel;

const mockInputEntry = {
    values: {
        notAffectedNumber: 1,
        notAffectedString: "some text",
        richText: mockRichTextValue,
        text: mockTextValue
    }
} as unknown as Required<CmsEntry>;

const mockIndexedEntry = {
    values: {
        notAffectedNumber: 1,
        notAffectedString: "some text",
        text: mockTextValue
    },
    rawValues: {
        richText: mockRichTextValue
    }
} as unknown as Required<CmsEntry> & Record<string, any>;

const getFieldIndexPlugin = () => {
    return defaultFieldIndexPlugin();
};

const fieldTypePlugins = createGraphQLFields();

const getFieldTypePlugin = (fieldType: string) => {
    return fieldTypePlugins.find(pl => pl.fieldType === fieldType) as CmsModelFieldToGraphQLPlugin;
};

describe("defaultFieldIndexPlugin", () => {
    test("toIndex should return transformed objects", () => {
        const plugin = defaultFieldIndexPlugin() as Required<CmsModelFieldToElasticsearchPlugin>;

        const result = mockModel.fields.reduce(
            (entry: any, field: any) => {
                const { value, rawValue } = plugin.toIndex({
                    rawValue: mockInputEntry.values[field.storageId],
                    value: mockInputEntry.values[field.storageId],
                    plugins: new PluginsContainer(),
                    getFieldIndexPlugin,
                    getFieldTypePlugin,
                    model: mockModel,
                    field
                });

                if (value) {
                    entry.values[field.storageId] = value;
                }

                if (rawValue) {
                    entry.rawValues[field.storageId] = rawValue;
                }

                return entry;
            },
            { values: {}, rawValues: {} }
        );

        expect(result).toEqual(mockIndexedEntry);
    });

    test("fromIndex should return transformed objects", () => {
        const plugin = defaultFieldIndexPlugin() as Required<CmsModelFieldToElasticsearchPlugin>;
        const result = mockModel.fields.reduce((entry: any, field) => {
            const value = plugin.fromIndex({
                value: mockIndexedEntry.values[field.storageId],
                rawValue: mockIndexedEntry.rawValues[field.storageId],
                getFieldIndexPlugin,
                getFieldTypePlugin,
                plugins: new PluginsContainer(),
                model: mockModel,
                field
            });

            if (value) {
                entry[field.storageId] = value;
            }

            return entry;
        }, {});

        expect(result).toEqual({
            notAffectedNumber: 1,
            notAffectedString: "some text",
            text: "some short searchable text",
            richText: mockRichTextValue
        });
    });
});
