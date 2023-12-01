import { PluginsContainer } from "@webiny/plugins";
import {
    CmsEntry,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types";
import { transformEntryKeys } from "./transformEntryKeys";
import { CmsIndexEntry } from "~/types";
import { transformEntryToIndex } from "~/operations/entry/transformations/transformEntryToIndex";
import { CmsEntryElasticsearchValuesModifier } from "~/plugins";
import { modifyEntryValues as modifyEntryValuesCallable } from "~/operations/entry/transformations/modifyEntryValues";
import { compress } from "@webiny/api-elasticsearch";
import { createLatestRecordType, createPublishedRecordType } from "~/operations/entry/recordType";
import WebinyError from "@webiny/error";

interface BaseTransformerParams {
    plugins: PluginsContainer;
    model: StorageOperationsCmsModel;
}

interface EntryTransformerParams extends BaseTransformerParams {
    entry: CmsEntry;
    storageEntry: CmsEntry;
    transformedToIndex?: never;
}

interface TransformedEntryTransformerParams extends BaseTransformerParams {
    entry?: never;
    storageEntry?: never;
    transformedToIndex: CmsIndexEntry;
}

interface TransformedKeysEntry {
    entry: CmsEntry;
    storageEntry: CmsEntry;
}

interface ModifiedEntryValues {
    entry: CmsEntry;
    storageEntry: CmsEntry;
}

interface TransformerResult {
    transformEntryKeys: () => TransformedKeysEntry;
    transformToIndex: () => CmsIndexEntry;
    getElasticsearchLatestEntryData: () => Promise<Record<string, any>>;
    getElasticsearchPublishedEntryData: () => Promise<Record<string, any>>;
}

export const createTransformer = (
    params: EntryTransformerParams | TransformedEntryTransformerParams
): TransformerResult => {
    const {
        plugins,
        model,
        entry: baseEntry,
        storageEntry: baseStorageEntry,
        transformedToIndex: initialTransformedEntryToIndex = undefined
    } = params;

    let transformedEntryKeys: TransformedKeysEntry | undefined = undefined;
    let transformedEntryToIndex: CmsIndexEntry | undefined = initialTransformedEntryToIndex;
    let modifiedEntryValues: ModifiedEntryValues | undefined = undefined;
    let elasticsearchLatestEntry: any = undefined;
    let elasticsearchPublishedEntry: any = undefined;

    const modifierPlugins = plugins
        .byType<CmsEntryElasticsearchValuesModifier>(CmsEntryElasticsearchValuesModifier.type)
        .filter(pl => pl.canModify(model.modelId));

    const modifyEntryValues = () => {
        if (initialTransformedEntryToIndex || !baseEntry) {
            throw new WebinyError(
                `Should not call the "modifyEntryValues" when "transformedToIndex" is provided.`,
                "METHOD_NOT_ALLOWED",
                {
                    entry: initialTransformedEntryToIndex
                }
            );
        }
        if (modifiedEntryValues) {
            return modifiedEntryValues;
        }
        const modifiedEntry = modifyEntryValuesCallable({
            plugins: modifierPlugins,
            model,
            entry: baseEntry
        });
        const modifiedStorageEntry = modifyEntryValuesCallable({
            plugins: modifierPlugins,
            model,
            entry: baseStorageEntry
        });

        return (modifiedEntryValues = transformEntryKeys({
            model,
            entry: modifiedEntry,
            storageEntry: modifiedStorageEntry
        }));
    };

    return {
        transformEntryKeys: function () {
            if (initialTransformedEntryToIndex || !baseEntry) {
                throw new WebinyError(
                    `Should not call the "modifyEntryValues" when "transformedToIndex" is provided.`,
                    "METHOD_NOT_ALLOWED",
                    {
                        entry: initialTransformedEntryToIndex
                    }
                );
            }
            if (transformedEntryKeys) {
                return transformedEntryKeys;
            }
            return (transformedEntryKeys = transformEntryKeys({
                model,
                entry: baseEntry,
                storageEntry: baseStorageEntry
            }));
        },
        transformToIndex: function () {
            if (transformedEntryToIndex) {
                return transformedEntryToIndex;
            }
            let entry: CmsEntry;
            let storageEntry: CmsStorageEntry;
            /**
             * In case there are value modifier plugins, we need to
             * - run modifiers
             * - transform keys
             */
            if (modifierPlugins.length > 0) {
                const result = modifyEntryValues();
                entry = result.entry;
                storageEntry = result.storageEntry;
            }
            // In case there are no modifier plugins, just transform the keys - or used already transformed.
            else {
                const result = this.transformEntryKeys();
                entry = result.entry;
                storageEntry = result.storageEntry;
            }
            return (transformedEntryToIndex = transformEntryToIndex({
                plugins,
                model,
                entry,
                storageEntry
            }));
        },
        getElasticsearchLatestEntryData: async function () {
            if (elasticsearchLatestEntry) {
                return elasticsearchLatestEntry;
            }
            const entry = this.transformToIndex();

            return (elasticsearchLatestEntry = await compress(plugins, {
                ...entry,
                latest: true,
                TYPE: createLatestRecordType(),
                __type: createLatestRecordType()
            }));
        },
        getElasticsearchPublishedEntryData: async function () {
            if (elasticsearchPublishedEntry) {
                return elasticsearchPublishedEntry;
            }
            const entry = this.transformToIndex();

            return (elasticsearchPublishedEntry = await compress(plugins, {
                ...entry,
                published: true,
                TYPE: createPublishedRecordType(),
                __type: createPublishedRecordType()
            }));
        }
    };
};
