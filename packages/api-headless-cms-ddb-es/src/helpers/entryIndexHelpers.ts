import { WebinyError } from "@webiny/error";
import type { CmsEntry, CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { CmsIndexEntry } from "~/types.js";
import { getFieldIdentifier, getFieldIdentifiers } from "~/helpers/fieldIdentifier.js";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import type {
    CmsEntryOpenSearchFieldIndex,
    CmsEntryOpenSearchFieldIndexRegistry
} from "~/features/CmsEntryOpenSearchFieldIndex/index.js";

interface SetupEntriesIndexHelpersParams {
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
}

interface ExtractEntriesFromIndexParams<T extends CmsEntryValues = CmsEntryValues>
    extends SetupEntriesIndexHelpersParams {
    model: CmsModel;
    entries: CmsIndexEntry<T>[];
}

interface PrepareElasticsearchDataParams<T extends CmsEntryValues = CmsEntryValues>
    extends SetupEntriesIndexHelpersParams {
    model: CmsModel;
    entry: CmsEntry<T>;
    storageEntry: CmsEntry<T>;
}

export const prepareEntryToIndex = <T extends CmsEntryValues = CmsEntryValues>(
    params: PrepareElasticsearchDataParams<T>
): CmsIndexEntry<T> => {
    const { fieldRegistry, fieldIndexRegistry, storageEntry, entry, model } = params;

    function getFieldIndex(type: string): CmsEntryOpenSearchFieldIndex.Interface {
        const fieldIndexing = fieldIndexRegistry.get(type);
        if (fieldIndexing) {
            return fieldIndexing;
        }
        return fieldIndexRegistry.getDefault();
    }

    // These objects will contain values processed by field index implementations
    const values: T = {} as T;
    const rawValues: T = {} as T;

    // We're only interested in current model fields.
    for (const field of model.fields) {
        const identifier = getFieldIdentifier(storageEntry.values, field) as keyof T;
        if (!identifier) {
            continue;
        }

        const fieldIndex = getFieldIndex(field.type);

        const { value, rawValue } = fieldIndex.toIndex({
            fieldRegistry,
            model,
            field,
            rawValue: entry.values[identifier],
            value: storageEntry.values[identifier],
            getFieldIndex
        });

        if (typeof value !== "undefined") {
            values[identifier] = value;
        }

        if (typeof rawValue !== "undefined") {
            rawValues[identifier] = rawValue;
        }
    }
    return {
        ...storageEntry,
        values,
        rawValues
    };
};

export const extractEntriesFromIndex = <T extends CmsEntryValues = CmsEntryValues>({
    fieldRegistry,
    fieldIndexRegistry,
    entries,
    model
}: ExtractEntriesFromIndexParams<T>): CmsEntry<T>[] => {
    function getFieldIndex(type: string): CmsEntryOpenSearchFieldIndex.Interface {
        const fieldIndex = fieldIndexRegistry.get(type);
        if (fieldIndex) {
            return fieldIndex;
        }
        return fieldIndexRegistry.getDefault();
    }

    const list: CmsEntry<T>[] = [];

    for (const entry of entries) {
        // This object will contain values processed by field index plugins
        const indexValues: T = {} as T;

        // We only consider fields that are present in the model
        for (const field of model.fields) {
            const fieldType = fieldRegistry.get(field.type);
            if (!fieldType) {
                throw new WebinyError(
                    `Missing field type "${field.type}". Extract entries from index.`
                );
            }

            const fieldIndex = getFieldIndex(field.type);
            /**
             * We can safely cast as the code will not continue in case of no identifiers.
             */
            const identifiers = getFieldIdentifiers(entry.values, entry.rawValues, field);
            if (!identifiers) {
                continue;
            }
            try {
                const key = identifiers.valueIdentifier as keyof T;
                const rawKey = identifiers.rawValueIdentifier as keyof T;
                indexValues[key] = fieldIndex.fromIndex({
                    fieldRegistry,
                    model,
                    field,
                    getFieldIndex,
                    value: entry.values[key || rawKey],
                    /**
                     * Possibly no rawValues so we must check for the existence of the field.
                     */
                    rawValue: entry.rawValues ? entry.rawValues[rawKey || key] : null
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not transform entry field from index.",
                    ex.code || "FIELD_FROM_INDEX_ERROR",
                    {
                        field,
                        entry
                    }
                );
            }
        }
        /**
         * Let's have a new entry so we do not modify the original one.
         */
        const newEntry: CmsEntry<T> = {
            ...entry,
            values: indexValues
        };
        /**
         * If we want to remove the rawValues, TYPE, latest, published and __type, we must make them optional or ignore them.
         */
        // @ts-expect-error
        delete newEntry["rawValues"];
        // @ts-expect-error
        delete newEntry["TYPE"];
        // @ts-expect-error
        delete newEntry["__type"];
        // @ts-expect-error
        delete newEntry["latest"];
        // @ts-expect-error
        delete newEntry["published"];
        list.push({
            ...newEntry
        });
    }

    return list;
};
