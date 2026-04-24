import { describe, expect, it } from "vitest";
import type { CmsModel, CmsModelDateTimeField } from "@webiny/api-headless-cms/types";
import { createTestContainer } from "~tests/helpers/createTestContainer";
import { CmsEntryOpenSearchFieldIndexRegistry } from "~/features/CmsEntryOpenSearchFieldIndex";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/features/graphql/index.js";

const container = createTestContainer();
const fieldIndexRegistry = container.resolve(CmsEntryOpenSearchFieldIndexRegistry);
const fieldRegistry = container.resolve(CmsModelFieldToGraphQLRegistry);

const getFieldIndex = (type: string) => {
    return fieldIndexRegistry.get(type) || fieldIndexRegistry.getDefault();
};

const createField = (type: CmsModelDateTimeField["settings"]["type"]): CmsModelDateTimeField => {
    return {
        id: "dateTimeId",
        fieldId: `${type}FieldId`,
        storageId: `datetime@${type}StorageId`,
        type: "datetime",
        settings: {
            type
        },
        label: type,
        validation: [],
        listValidation: []
    };
};

const model = {
    modelId: "testModel",
    name: "testModel",
    tenant: "root",
    fields: [],
    layout: []
} as unknown as CmsModel;

describe("Date time indexing plugin", () => {
    const plugin = fieldIndexRegistry.get("datetime")!;

    const dateValues: (string | string[])[][] = [
        ["2022-06-10", "2022-06-10"],
        ["2022-06-15", "2022-06-15"],
        ["2022-12-06", "2022-12-06"],
        ["2022-12-20", "2022-12-20"],
        [
            ["2022-06-10", "2022-06-15", "2022-12-06", "2022-12-20"],
            ["2022-06-10", "2022-06-15", "2022-12-06", "2022-12-20"]
        ]
    ];

    it.each(dateValues)(
        "should properly transform date to index value and back - %s",
        (value, expected) => {
            const toIndexResult = plugin.toIndex({
                field: createField("date"),
                getFieldIndex,
                fieldRegistry,
                model,
                value,
                rawValue: {}
            });

            expect(toIndexResult).toEqual({
                value: expected,
                rawValue: undefined
            });

            const fromIndexResult = plugin.fromIndex({
                field: createField("date"),
                getFieldIndex,
                fieldRegistry,
                model,
                value: toIndexResult.value,
                rawValue: {}
            });

            expect(fromIndexResult).toEqual(value);
        }
    );

    const dateTimeWithTimezone: (string | string[])[][] = [
        ["2022-06-10T20:54:53.000Z", "2022-06-10T20:54:53.000Z"],
        ["2022-06-15T20:54:53.000Z", "2022-06-15T20:54:53.000Z"],
        ["2022-12-06T20:54:53.000Z", "2022-12-06T20:54:53.000Z"],
        ["2022-12-20T20:54:53.000Z", "2022-12-20T20:54:53.000Z"]
    ];

    it.each(dateTimeWithTimezone)(
        "should properly transform dateTimeWithTimezone to index value and back - %s",
        (value, expected) => {
            const toIndexResult = plugin.toIndex({
                field: createField("dateTimeWithTimezone"),
                getFieldIndex,
                fieldRegistry,
                model,
                value,
                rawValue: {}
            });

            expect(toIndexResult).toEqual({
                value: expected,
                rawValue: undefined
            });

            const fromIndexResult = plugin.fromIndex({
                field: createField("dateTimeWithTimezone"),
                getFieldIndex,
                fieldRegistry,
                model,
                value: toIndexResult.value,
                rawValue: {}
            });

            expect(fromIndexResult).toEqual(value);
        }
    );

    const time: ([string, number] | [string[], number[]])[] = [
        ["19:54:53", 71693],
        ["20:54:53", 75293],
        ["03:54:53", 14093],
        ["10:54:53", 39293],
        [
            ["19:54:53", "20:54:53", "03:54:53", "10:54:53"],
            [71693, 75293, 14093, 39293]
        ]
    ];

    it.each(time)(
        "should properly transform time to index value and back - %s",
        (value, expected) => {
            const toIndexResult = plugin.toIndex({
                field: createField("time"),
                getFieldIndex,
                fieldRegistry,
                model,
                value,
                rawValue: {}
            });

            expect(toIndexResult).toEqual({
                value: expected,
                rawValue: undefined
            });

            const fromIndexResult = plugin.fromIndex({
                field: createField("time"),
                getFieldIndex,
                fieldRegistry,
                model,
                value: toIndexResult.value,
                rawValue: {}
            });

            expect(fromIndexResult).toEqual(value);
        }
    );
});
