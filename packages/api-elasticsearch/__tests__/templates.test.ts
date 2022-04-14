import { Client } from "@elastic/elasticsearch";
import { base } from "~/indexConfiguration/base";
import { japanese } from "~/indexConfiguration/japanese";
import { ElasticsearchIndexRequestBody } from "~/types";
import {
    createElasticsearchClient,
    deleteAllIndices,
    putTemplate,
    getTemplate,
    deleteAllTemplates
} from "./helpers";

/**
 * Add configurations when added to the code.
 */
const settings: [string, ElasticsearchIndexRequestBody][] = [
    ["base", base],
    ["japanese", japanese]
];

const order = 75;

const createIndexPattern = (name: string): string => {
    return `pattern-${name}`;
};

describe("Elasticsearch Templates", () => {
    let client: Client;

    beforeEach(async () => {
        client = createElasticsearchClient();
        await deleteAllIndices(client);
        await deleteAllTemplates(client);
    });

    afterEach(async () => {
        await deleteAllIndices(client);
        await deleteAllTemplates(client);
    });

    it.each(settings)(
        "should create template with correct settings - %s",
        // @ts-ignore
        async (name: string, setting: ElasticsearchIndexRequestBody) => {
            const templateName = `template-${name}`;

            const index_patterns: string[] = [createIndexPattern(name)];

            const createResponse = await putTemplate(client, {
                name: templateName,
                order,
                body: {
                    index_patterns,
                    aliases: {},
                    ...setting
                }
            });

            expect(createResponse).toMatchObject({
                body: {
                    acknowledged: true
                },
                statusCode: 200
            });

            const response = await getTemplate(client);

            expect(response).toMatchObject({
                body: {
                    [templateName]: {
                        ...setting,
                        order,
                        aliases: {},
                        index_patterns
                    }
                },
                statusCode: 200
            });

            expect(response.body[templateName]).toEqual({
                ...setting,
                order,
                aliases: {},
                index_patterns
            });
        }
    );
});
