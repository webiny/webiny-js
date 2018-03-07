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
     * @returns {Promise<{}>}
     */
    async get(data: {}, keys: string = "", options: ExtractionOptions = {}): {} {
        // First we remove all breaks from the string.
        keys = keys.replace(/\s/g, "").trim();

        // Recursively processes all root and nested keys.
        return this.__process({ data, keys }, options).then(({ output }) => output);
    }

    /**
     * Processes given params with given extraction options. Can be called recursively on nested data.
     * @param params     Contains data, keys, initial path and output object.
     * @param options    Various options, eg. onRead callback or ability to still include keys with undefined values.
     * @returns {Promise<ExtractedData>}
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
     * Directly modifies final output object with extracted data. Can be called recursively on nested data.
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

        // If current data fragment is not an object or in other words, a value where we cannot do something like x[y],
        // then we return immediately. For example if this was null, trying to do null[y] would throw an error.
        if (!_.isObject(fragments.data)) {
            return;
        }

        // Path is an array with keys that we need to go over. For example, company.image.src would have two
        // items in path array: 'company' and 'image', so we must first read these.

        // If we reached the last key (or if only one key was passed), then we just modify the output and exit.
        if (path.length === 0) {
            const final = { value: undefined, key };
            if (typeof options.onRead === "function") {
                const results = await options.onRead(data, key);
                final.key = results[0];
                final.value = results[1];
            } else {
                final.value = await data[key];
            }

            if (typeof final.value === "undefined") {
                if (options.includeUndefined === true) {
                    fragments.output[final.key] = final.value;
                }
            } else {
                fragments.output[final.key] = final.value;
            }

            return;
        }

        // If we have keys that we need go over, let's take the first one.
        for (let i = 0; i < path.length; i++) {
            const step = path[i];

            // If we don't have a key assigned in our output object, let's assign a default value to it.
            // We read the value in received data, and if it's an array, that means we need to iterate and
            // apply reading of received keys on each one.
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

            // If value is an array, let's iterate over each and apply reading multiple times.
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
}

export default new DataExtractor();
