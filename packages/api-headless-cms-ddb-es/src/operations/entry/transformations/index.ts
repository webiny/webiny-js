import type { PluginsContainer } from "@webiny/plugins";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { transformEntryKeys } from "./transformEntryKeys.js";
import type { CmsIndexEntry } from "~/types.js";
import { transformEntryToIndex } from "~/operations/entry/transformations/transformEntryToIndex.js";
import { CmsEntryElasticsearchValuesModifier } from "~/plugins/index.js";
import { modifyEntryValues as modifyEntryValuesCallable } from "~/operations/entry/transformations/modifyEntryValues.js";
import {
    createLatestRecordType,
    createPublishedRecordType
} from "~/operations/entry/recordType.js";
import WebinyError from "@webiny/error";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/features/graphql/index.js";
import { CompressionHandler } from "@webiny/utils/features/compression/abstractions/CompressionHandler.js";

interface BaseTransformerParams<T extends CmsEntryValues = CmsEntryValues> {
    plugins: PluginsContainer;
    model: StorageOperationsCmsModel<T>;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    compressionHandler: Pick<CompressionHandler.Interface, "compress">;
}

interface EntryTransformerParams<T extends CmsEntryValues = CmsEntryValues>
    extends BaseTransformerParams<T> {
    entry: CmsEntry<T>;
    storageEntry: CmsEntry<T>;
    transformedToIndex?: never;
}

interface TransformedEntryTransformerParams<T extends CmsEntryValues = CmsEntryValues>
    extends BaseTransformerParams<T> {
    entry?: never;
    storageEntry?: never;
    transformedToIndex: CmsIndexEntry<T>;
}

interface TransformedKeysEntry<T extends CmsEntryValues = CmsEntryValues> {
    entry: CmsEntry<T>;
    storageEntry: CmsEntry<T>;
}

interface ModifiedEntryValues<T extends CmsEntryValues = CmsEntryValues> {
    entry: CmsEntry<T>;
    storageEntry: CmsEntry<T>;
}

interface TransformerResult<T extends CmsEntryValues = CmsEntryValues> {
    transformEntryKeys: () => TransformedKeysEntry<T>;
    transformToIndex: () => CmsIndexEntry<T>;
    getElasticsearchLatestEntryData: () => Promise<Record<string, any>>;
    getElasticsearchPublishedEntryData: () => Promise<Record<string, any>>;
}

export const createTransformer = <T extends CmsEntryValues = CmsEntryValues>(
    params: EntryTransformerParams<T> | TransformedEntryTransformerParams<T>
): TransformerResult<T> => {
    const {
        plugins,
        model,
        fieldRegistry,
        entry: baseEntry,
        storageEntry: baseStorageEntry,
        transformedToIndex: initialTransformedEntryToIndex = undefined,
        compressionHandler
    } = params;

    let transformedEntryKeys: TransformedKeysEntry<T> | undefined = undefined;
    let transformedEntryToIndex: CmsIndexEntry<T> | undefined = initialTransformedEntryToIndex;
    let modifiedEntryValues: ModifiedEntryValues<T> | undefined = undefined;
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
        const modifiedEntry = modifyEntryValuesCallable<T>({
            plugins: modifierPlugins,
            model,
            entry: baseEntry
        });
        const modifiedStorageEntry = modifyEntryValuesCallable<T>({
            plugins: modifierPlugins,
            model,
            entry: baseStorageEntry
        });

        return (modifiedEntryValues = transformEntryKeys<T>({
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
            let entry: CmsEntry<T>;
            let storageEntry: CmsStorageEntry<T>;
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
            return (transformedEntryToIndex = transformEntryToIndex<T>({
                plugins,
                model,
                entry,
                storageEntry,
                fieldRegistry
            }));
        },
        getElasticsearchLatestEntryData: async function () {
            if (elasticsearchLatestEntry) {
                return elasticsearchLatestEntry;
            }
            const entry = this.transformToIndex();

            return (elasticsearchLatestEntry = await compressionHandler.compress({
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

            return (elasticsearchPublishedEntry = await compressionHandler.compress({
                ...entry,
                published: true,
                TYPE: createPublishedRecordType(),
                __type: createPublishedRecordType()
            }));
        }
    };
};
