/**
 * @typedef ExtractionOptions
 * @name ExtractionOptions
 * @description This type defines all possible data extraction options.
 * @property {boolean} includeUndefined By default, if extracted value is undefined, the key will be omitted the final output. Set to `true` if this behavior is not desired.
 * @property {Function} onRead A callback function, which gets triggered when data extractor tries to read a key from given data.
 */
export type ExtractedData = {
    output: Object,
    processed: { characters: number }
};

/**
 * @typedef ExtractedData
 * @name ExtractedData
 * @description This type defines a structure of extracted data.
 * @property {string} name Validator name.
 * @private
 */
export type ExtractionOptions = {
    onRead?: Function,
    includeUndefined?: boolean
};

/**
 * @typedef ExtractionParams
 * @private
 * @name ExtractionParams
 * @description This type defines a structure of validation error data object.
 * @property {string} name Validator name.
 */
export type ExtractionParams = {
    data?: {},
    output?: {},
    keys?: string,
    initialPath?: []
};
