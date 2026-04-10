import { describe, expect, it } from "vitest";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { createTestContainer } from "~tests/helpers/createTestContainer";
import { CmsEntryOpenSearchFieldIndexRegistry } from "~/features/CmsEntryOpenSearchFieldIndex";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/features/graphql/index.js";

const container = createTestContainer();
const fieldIndexRegistry = container.resolve(CmsEntryOpenSearchFieldIndexRegistry);
const fieldRegistry = container.resolve(CmsModelFieldToGraphQLRegistry);

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

const plugin = fieldIndexRegistry.getDefault();

const getFieldIndex = (type: string) => {
    return fieldIndexRegistry.get(type) || fieldIndexRegistry.getDefault();
};

describe("defaultFieldIndexPlugin", () => {
    it("toIndex should return transformed objects", () => {
        const result = mockModel.fields.reduce(
            (entry: any, field: any) => {
                const { value, rawValue } = plugin.toIndex({
                    rawValue: mockInputEntry.values[field.storageId],
                    value: mockInputEntry.values[field.storageId],
                    getFieldIndex,
                    model: mockModel,
                    field,
                    fieldRegistry
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

    it("fromIndex should return transformed objects", () => {
        const result = mockModel.fields.reduce((entry: any, field) => {
            const value = plugin.fromIndex({
                value: mockIndexedEntry.values[field.storageId],
                rawValue: mockIndexedEntry.rawValues[field.storageId],
                getFieldIndex,
                model: mockModel,
                field,
                fieldRegistry
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
