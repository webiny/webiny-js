import dateTimeIndexing from "~/elasticsearch/indexing/dateTimeIndexing";
import { CmsModelFieldToElasticsearchPlugin } from "~/types";
import {
    CmsModel,
    CmsModelDateTimeField,
    CmsModelFieldToGraphQLPlugin
} from "@webiny/api-headless-cms/types";
import elasticsearchIndexingPlugins from "~/elasticsearch/indexing";
import { createGraphQLFields } from "@webiny/api-headless-cms";
import defaultIndexingPlugin from "~/elasticsearch/indexing/defaultFieldIndexing";
import { PluginsContainer } from "@webiny/plugins";

const indexingPlugins = elasticsearchIndexingPlugins();
const fieldTypePlugins = createGraphQLFields();

const plugins = new PluginsContainer([indexingPlugins, fieldTypePlugins]);

const getFieldIndexPlugin = (fieldType: string) => {
    return indexingPlugins.find(pl => pl.fieldType === fieldType) || defaultIndexingPlugin();
};

const getFieldTypePlugin = (fieldType: string) => {
    return fieldTypePlugins.find(pl => pl.fieldType === fieldType) as CmsModelFieldToGraphQLPlugin;
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
        label: type
    };
};

const model = {
    modelId: "testModel",
    name: "testModel",
    tenant: "root",
    locale: "en-US",
    fields: [],
    layout: []
} as unknown as CmsModel;

const getPlugin = () => {
    const plugin = dateTimeIndexing();

    if (!plugin.toIndex || !plugin.fromIndex) {
        throw new Error("There are no toIndex or fromIndex methods.");
    }
    return plugin as Required<CmsModelFieldToElasticsearchPlugin>;
};

describe("Date time indexing plugin", () => {
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
            const toIndexResult = getPlugin().toIndex({
                field: createField("date"),
                getFieldIndexPlugin,
                getFieldTypePlugin,
                plugins,
                model,
                value,
                rawValue: {}
            });

            expect(toIndexResult).toEqual({
                value: expected,
                rawValue: undefined
            });

            const fromIndexResult = getPlugin().fromIndex({
                field: createField("date"),
                getFieldIndexPlugin,
                getFieldTypePlugin,
                plugins,
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
            const toIndexResult = getPlugin().toIndex({
                field: createField("dateTimeWithTimezone"),
                getFieldIndexPlugin,
                getFieldTypePlugin,
                plugins,
                model,
                value,
                rawValue: {}
            });

            expect(toIndexResult).toEqual({
                value: expected,
                rawValue: undefined
            });

            const fromIndexResult = getPlugin().fromIndex({
                field: createField("dateTimeWithTimezone"),
                getFieldIndexPlugin,
                getFieldTypePlugin,
                plugins,
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
            const toIndexResult = getPlugin().toIndex({
                field: createField("time"),
                getFieldIndexPlugin,
                getFieldTypePlugin,
                plugins,
                model,
                value,
                rawValue: {}
            });

            expect(toIndexResult).toEqual({
                value: expected,
                rawValue: undefined
            });

            const fromIndexResult = getPlugin().fromIndex({
                field: createField("time"),
                getFieldIndexPlugin,
                getFieldTypePlugin,
                plugins,
                model,
                value: toIndexResult.value,
                rawValue: {}
            });

            expect(fromIndexResult).toEqual(value);
        }
    );
});
