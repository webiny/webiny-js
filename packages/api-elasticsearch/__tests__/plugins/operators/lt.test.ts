import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorLesserThanPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorLesserThanPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorLesserThanPlugin();
    const context: any = {};

    it("should apply lt correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            path: "id",
            basePath: "id",
            context,
            keyword: false
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must_not: [],
            must: [
                {
                    range: {
                        id: {
                            lt: 100
                        }
                    }
                }
            ],
            filter: [],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple lt correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            path: "id",
            basePath: "id",
            context,
            keyword: false
        });

        const to = new Date();
        plugin.apply(query, {
            value: to,
            path: "date",
            basePath: "date",
            context,
            keyword: false
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must_not: [],
            must: [
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
                            lt: to as any
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
