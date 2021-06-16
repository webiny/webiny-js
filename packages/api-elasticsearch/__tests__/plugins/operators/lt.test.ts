import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-plugin-elastic-search-client/types";
import { ElasticsearchQueryBuilderOperatorLesserThanPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorLesserThanPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorLesserThanPlugin();
    const context: any = {};

    it("should apply lt correctly", () => {
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
            context
        });

        const to = new Date();
        plugin.apply(query, {
            value: to,
            path: "date",
            context
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
