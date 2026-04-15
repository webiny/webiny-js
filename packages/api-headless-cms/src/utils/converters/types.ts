import type { ConverterCollectionConvertParams as BaseConverterCollectionConvertParams } from "~/utils/converters/ConverterCollection.js";
import type { CmsEntryValues } from "~/types/index.js";

/**
 * In the first call of the converter we do not need the fields property as it will be taken directly from the model.
 */
export interface ConverterCollectionConvertParams<T extends CmsEntryValues = CmsEntryValues>
    extends Omit<BaseConverterCollectionConvertParams<T>, "fields"> {
    fields?: BaseConverterCollectionConvertParams["fields"];
}
