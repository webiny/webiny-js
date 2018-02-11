/**
 * @typedef ExtractionOptions
 * @name ExtractionOptions
 * @description All possible data extraction options.
 * @property {boolean} [includeUndefined=false] By default, if extracted value is undefined, its key will be omitted in the final output. Set to `true` if this behavior is not desired.
 * @property {Function} [onRead=undefined] A callback function, which gets triggered when data extractor tries to read a key from given data.
 */
export type ExtractionOptions = {
    includeUndefined?: boolean,
    onRead?: Function
};

/**
 * Output and its meta data - total count of processed characters. Used internally.
 * @typedef ExtractedData
 * @name ExtractedData
 * @property {object} output Current output object.
 * @property {object} processed Information about data extraction.
 * @private
 */
export type ExtractedData = {
    output: {},
    processed: { characters: number }
};

/**
 * @typedef ExtractionParams
 * @name ExtractionParams
 * @description Extraction params that carry given data, output, given keys and initial path. Used internally.
 * @property {object} data Data object upon which the extraction is being processed.
 * @property {object} output Data object upon which the extraction is being processed.
 * @property {string} keys Keys which need to be extracted from received data.
 * @property {Array<string>} initialPath Keys that need to be read before the final key (eg. company.image.src).
 * @private
 */
export type ExtractionParams = {
    data: {},
    output: {},
    keys: string,
    initialPath: []
};
