import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin();

    it("should apply gte correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            name: "id",
            value: 100,
            path: "id",
            basePath: "id",
            keyword: false
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must_not: [],
            must: [],
            filter: [
                {
                    range: {
                        id: {
                            gte: 100
                        }
                    }
                }
            ],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple gte correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            name: "id",
            value: 100,
            path: "id",
            basePath: "id",
            keyword: false
        });

        const from = new Date().toISOString();
        plugin.apply(query, {
            name: "id",
            value: from,
            path: "date",
            basePath: "date",
            keyword: false
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must_not: [],
            must: [],
            filter: [
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
                            gte: from
                        }
                    }
                }
            ],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
