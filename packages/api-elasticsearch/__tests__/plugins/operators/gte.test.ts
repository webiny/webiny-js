import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin();
    const context: any = {};

    it("should apply gte correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            path: "id",
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
            path: "id",
            context
        });

        const from = new Date();
        plugin.apply(query, {
            value: from,
            path: "date",
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
