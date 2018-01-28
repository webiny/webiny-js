// @flow
import _ from "lodash";

declare type ExtractedData = {
    output: Object,
    processed: { characters: number }
};

declare type ProcessParams = {
    data: Object,
    keys: string,
    output?: Object,
    initialPath?: Array<string>
};

declare type ModifyParams = {
    data: Object,
    key: string,
    output: Object,
    path: Array<string>
};

class DataExtractor {
    async get(data: Object, keys: string = ""): Object {
        // First we remove all breaks from the string.
        keys = keys.replace(/\s/g, "").trim();

        // Recursively processes all root and nested keys.
        return this.__process({ data, keys }).then(({ output }) => output);
    }

    async __process(params: ProcessParams): Promise<ExtractedData> {
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
                case current === undefined: {
                    key && (await this.__modifyOutput({ output, key, data, path: currentPath }));
                    key = "";
                    currentPath = initialPath.slice(0);
                    break;
                }
                case current === "]": {
                    key && (await this.__modifyOutput({ output, key, data, path: currentPath }));
                    break outerLoop;
                }
                case current === "[": {
                    const path = currentPath.splice(0);
                    path.push(key);
                    const nested: ExtractedData = await this.__process({
                        data,
                        initialPath: path,
                        keys: keys.substr(i + 1),
                        output
                    });
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

    async __modifyOutput(params: ModifyParams): Promise<void> {
        const { output, data = {}, key = "", path = [] } = params;
        const fragments = { output, data };

        if (path.length === 0) {
            const value = await fragments.data[key];

            if (typeof value === "undefined") {
                // Don't assign the key then, since undefined is not a part of JSON standard.
            } else {
                fragments.output[key] = await fragments.data[key];
            }

            return;
        }

        for (let i = 0; i < path.length; i++) {
            const step = path[i];

            if (typeof fragments.output[step] === "undefined") {
                fragments.output[step] = _.isArray(fragments.data[step]) ? [] : {}; // TODO: Check, is this the case really?
            }

            if (_.isArray(fragments.data[step])) {
                for (let j = 0; j < fragments.data[step].length; j++) {
                    if (typeof fragments.output[step][j] === "undefined") {
                        fragments.output[step][j] = {}; // TODO: Check, is this the case really?
                    }

                    await this.__modifyOutput({
                        output: fragments.output[step][j],
                        path: path.slice(i + 1),
                        key,
                        data: fragments.data[step][j]
                    });
                }

                break;
            }

            fragments.output = await fragments.output[step];
            fragments.data = await fragments.data[step];

            await this.__modifyOutput({
                output: fragments.output,
                data: fragments.data,
                path: path.slice(i + 1),
                key
            });
        }
    }
}

export default new DataExtractor();
