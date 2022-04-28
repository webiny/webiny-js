import { base } from "~/elasticsearch/templates/base";
import { PageElasticsearchIndexTemplatePlugin } from "~/plugins/definitions/PageElasticsearchIndexTemplatePlugin";

import { createElasticsearchClient } from "../../api-elasticsearch/__tests__/helpers";

import {
    // deleteTemplates,
    putTemplate,
    getTemplates
} from "@webiny/project-utils/testing/elasticsearch/templates";
// import { deleteIndexes } from "@webiny/project-utils/testing/elasticsearch/indices";

const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

const defaultTemplateName = `${prefix}page-builder-pages-index-default`;
const defaultTemplateOrder = 350;

const testPageBuilderIndexName = `${prefix}test-page-builder`;

const noPropertyIndex = new PageElasticsearchIndexTemplatePlugin({
    name: "no-property-pages-index",
    order: 351,
    body: {
        index_patterns: ["*test-page-builder"],
        settings: {} as any,
        mappings: {
            properties: {
                rawValues: {
                    enabled: false
                }
            }
        }
    }
});

const disableSourceIndexTemplateName = `${prefix}disable-source-pages-index`;
const disableSourceIndex = new PageElasticsearchIndexTemplatePlugin({
    name: disableSourceIndexTemplateName,
    order: 352,
    body: {
        index_patterns: ["*test-page-builder"],
        aliases: {
            ["testable-page-builder"]: {}
        },
        settings: {} as any,
        mappings: {
            _source: {
                enabled: false
            }
        }
    }
});

describe("Elasticsearch Index Template", () => {
    const client = createElasticsearchClient();

    beforeEach(async () => {
        // await deleteIndexes({
        //     client
        // });
        // await deleteTemplates({
        //     client
        // });
    });

    afterEach(async () => {
        // await deleteIndexes({
        //     client
        // });
        // await deleteTemplates({ client });
    });

    it("should insert default index template", async () => {
        const insert = await putTemplate({
            client,
            template: base.template,
            prefix
        });

        expect(insert).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const response = await getTemplates({
            client
        });

        expect(response).toMatchObject({
            body: {
                [defaultTemplateName]: {
                    order: defaultTemplateOrder,
                    index_patterns: ["*-page-builder"]
                }
            },
            statusCode: 200
        });
    });

    it("should insert default template and add few more", async () => {
        await putTemplate({
            client,
            template: base.template,
            prefix
        });

        const insertPropertyNoIndexResult = await putTemplate({
            client,
            template: noPropertyIndex.template,
            prefix
        });
        expect(insertPropertyNoIndexResult).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const insertDisableSourceIndexResult = await putTemplate({
            client,
            template: disableSourceIndex.template,
            prefix
        });
        expect(insertDisableSourceIndexResult).toMatchObject({
            body: {
                acknowledged: true
            },
            statusCode: 200
        });

        const response = await getTemplates({
            client
        });

        expect(response).toMatchObject({
            body: {
                [defaultTemplateName]: {
                    order: defaultTemplateOrder,
                    index_patterns: ["*-page-builder"]
                },
                [noPropertyIndex.template.name]: {
                    order: noPropertyIndex.template.order,
                    ...noPropertyIndex.template.body
                },
                [disableSourceIndex.template.name]: {
                    order: disableSourceIndex.template.order,
                    ...disableSourceIndex.template.body
                }
            },
            statusCode: 200
        });
    });

    it("should insert templates and create index that will have those mappings", async () => {
        await putTemplate({
            client,
            template: base.template,
            prefix
        });
        await putTemplate({
            client,
            template: noPropertyIndex.template,
            prefix
        });
        await putTemplate({
            client,
            template: disableSourceIndex.template,
            prefix
        });

        const createResponse = await client.indices.create({
            index: testPageBuilderIndexName
        });

        expect(createResponse).toMatchObject({
            body: {
                acknowledged: true,
                index: testPageBuilderIndexName,
                shards_acknowledged: true
            },
            meta: {
                aborted: false
            },
            statusCode: 200
        });

        const response = await client.indices.get({
            index: testPageBuilderIndexName
        });

        expect(response).toMatchObject({
            body: {
                [testPageBuilderIndexName]: {
                    aliases: {},
                    mappings: {
                        _source: {
                            enabled: false
                        },
                        properties: {
                            property: {
                                analyzer: "lowercase_analyzer",
                                fields: {
                                    keyword: {
                                        ignore_above: 256,
                                        type: "keyword"
                                    }
                                },
                                type: "text"
                            },
                            rawValues: {
                                enabled: false,
                                type: "object"
                            }
                        }
                    },
                    settings: {
                        index: {
                            analysis: {
                                analyzer: {
                                    lowercase_analyzer: {
                                        filter: ["lowercase", "trim"],
                                        tokenizer: "keyword",
                                        type: "custom"
                                    }
                                }
                            },
                            creation_date: expect.stringMatching(/^([0-9]+)$/),
                            number_of_replicas: "1",
                            number_of_shards: "1",
                            provided_name: "test-page-builder",
                            version: {
                                created: expect.stringMatching(/^([0-9]+)$/)
                            }
                        }
                    }
                }
            },
            meta: {
                aborted: false
            },
            statusCode: 200
        });
    });
});
