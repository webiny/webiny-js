import { ElasticsearchBoolQueryConfig } from "../src/types";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/client";

export const createBlankQuery = (): ElasticsearchBoolQueryConfig => ({
    must_not: [],
    must: [],
    filter: [],
    should: []
});

export { createElasticsearchClient };

const characters = "abcdefghijklmnopqrstuvwxyz";

export const createPrefixId = (length = 10): string => {
    const output: string[] = [];
    const total = characters.length;
    for (let i = 0; i < length; i++) {
        output.push(characters.charAt(Math.floor(Math.random() * total)));
    }

    output.push("-");
    return output.join("");
};
