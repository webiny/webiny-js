import { elasticsearchOperatorGtePlugin } from "../../../../src/elasticsearch/operators/gte";
import { createBlankQuery } from "../helpers";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";

describe("elasticsearchOperatorGtePlugin", () => {
    const plugin = elasticsearchOperatorGtePlugin();
    const context: any = {};

    it("should apply gte correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            field: "id",
            context
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must_not: [],
            must: [
                {
                    range: {
                        id: {
                            gte: 100
                        }
                    }
                }
            ],
            filter: [],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple gte correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            field: "id",
            context
        });

        const from = new Date();
        plugin.apply(query, {
            value: from,
            field: "date",
            context
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must_not: [],
            must: [
                {
                    range: {
                        id: {
                            gte: 100
                        }
                    }
                },
                {
                    range: {
                        date: {
                            gte: from as any
                        }
                    }
                }
            ],
            filter: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
