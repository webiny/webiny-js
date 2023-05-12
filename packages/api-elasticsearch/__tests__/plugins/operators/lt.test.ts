import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorLesserThanPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorLesserThanPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorLesserThanPlugin();

    it("should apply lt correctly", () => {
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
                            lt: 100
                        }
                    }
                }
            ],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple lt correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            name: "id",
            value: 100,
            path: "id",
            basePath: "id",
            keyword: false
        });

        const to = new Date().toISOString();
        plugin.apply(query, {
            name: "id",
            value: to,
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
                            lt: 100
                        }
                    }
                },
                {
                    range: {
                        date: {
                            lt: to
                        }
                    }
                }
            ],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
