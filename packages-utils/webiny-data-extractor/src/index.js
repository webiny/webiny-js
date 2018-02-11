// @flow
import _ from "lodash";
import type { ExtractionOptions, ExtractedData, ExtractionParams } from "./../types";

/**
 * Data extractor class.
 */
class DataExtractor {
    /**
     * Returns extracted data.
     * @param data    Data object on which the extraction will be performed.
     * @param keys    Comma-separated keys which need to be extracted. For nested keys, dot and square brackets notation is available.
     * @param options    Extraction options.
     * @param options.includeUndefined
     * Include keys of values that are undefined
     * By default, if extracted value is undefined, the key will be omitted the final output. This can be prevented by setting this option to `true`.
     * @param options.onRead
     * A callback function, which gets triggered when data extractor tries to read a key from given data.
     * @returns {Promise<ExtractedData.output>}
     */
    async get(data: {}, keys: string = "", options: ExtractionOptions = {}): {} {
        // First we remove all breaks from the string.
        keys = keys.replace(/\s/g, "").trim();

        // Recursively processes all root and nested keys.
        return this.__process({ data, keys }, options).then(({ output }) => output);
    }

    /**
     * Processes given params with given extraction options. Can be called recursively on nested data.
     * @param params    Contains data, keys, initial path and output object.
     * @param options    Various options, eg. onRead callback or ability to still include undefined keys.
     * @returns {Promise<{output: {}, processed: {characters: number}}>}
     * @private
     */
    async __process(
        params: ExtractionParams,
        options: ExtractionOptions = {}
    ): Promise<ExtractedData> {
        const { data, keys = "", output = {}, initialPath = [] } = params;
        let key: string = "",
            characters: number = 0,
            currentPath: Array<string> = initialPath.slice(0);
        outerLoop: for (let i = 0; i <= keys.length; i++) {
            const current = keys[i];
            if (typeof current !== "undefined") {
                characters++;
            }
            switch (true) {
                case current === ",":
                case typeof current === "undefined": {
                    key &&
                        (await this.__modifyOutput(
                            { output, key, data, path: currentPath },
                            options
                        ));
                    key = "";
                    currentPath = initialPath.slice(0);
                    break;
                }
                case current === "]": {
                    key &&
                        (await this.__modifyOutput(
                            { output, key, data, path: currentPath },
                            options
                        ));
                    break outerLoop;
                }
                case current === "[": {
                    const path = currentPath.splice(0);
                    path.push(key);
                    const nested: ExtractedData = await this.__process(
                        {
                            data,
                            initialPath: path,
                            keys: keys.substr(i + 1),
                            output
                        },
                        options
                    );
                    characters += nested.processed.characters;
                    i += nested.processed.characters;
                    key = "";
                    break;
                }
                case current === ".":
                    currentPath.push(key);
                    key = "";
                    break;
                default:
                    key += current;
            }
        }

        return {
            output,
            processed: { characters }
        };
    }

    /**
     * Modifies final output object with extracted data. Can be called recursively on nested data.
     * @param params
     * @param options
     * @returns {Promise<void>}
     * @private
     */
    async __modifyOutput(
        params: ExtractionParams = {},
        options: ExtractionOptions = {}
    ): Promise<void> {
        const { output, data = {}, key = "", path = [] } = params;

        if (_.isEmpty(key)) {
            return;
        }

        const fragments: { output: Object, data: Object } = { output, data };

        if (!_.isObject(fragments.data)) {
            return;
        }

        if (path.length === 0) {
            const value = await this.__read(fragments.data, key, options.onRead);

            if (typeof value === "undefined") {
                if (options.includeUndefined === true) {
                    fragments.output[key] = value;
                }
            } else {
                fragments.output[key] = value;
            }

            return;
        }

        for (let i = 0; i < path.length; i++) {
            const step = path[i];

            const currentStepData = await fragments.data[step];
            if (typeof fragments.output[step] === "undefined") {
                switch (true) {
                    case _.isArray(currentStepData):
                        fragments.output[step] = [];
                        break;
                    case _.isObject(currentStepData):
                        fragments.output[step] = {};
                        break;
                    default:
                        fragments.output[step] = currentStepData;
                }
            }

            if (_.isArray(currentStepData)) {
                for (let j = 0; j < currentStepData.length; j++) {
                    if (typeof fragments.output[step][j] === "undefined") {
                        fragments.output[step][j] = {};
                    }

                    await this.__modifyOutput(
                        {
                            output: fragments.output[step][j],
                            path: path.slice(i + 1),
                            key,
                            data: currentStepData[j]
                        },
                        options
                    );
                }

                break;
            }

            fragments.output = await fragments.output[step];
            fragments.data = await fragments.data[step];

            await this.__modifyOutput(
                {
                    output: fragments.output,
                    data: fragments.data,
                    path: path.slice(i + 1),
                    key
                },
                options
            );
        }
    }

    /**
     * Reads given key in given data directly or with a "onRead" callback.
     * @param data
     * @param key
     * @param onRead
     * @returns {Promise<*>}
     * @private
     */
    async __read(data: {}, key: string, onRead: ?Function): Promise<mixed> {
        if (typeof onRead === "function") {
            return onRead(data, key);
        }

        return await data[key];
    }
}

export default new DataExtractor();
