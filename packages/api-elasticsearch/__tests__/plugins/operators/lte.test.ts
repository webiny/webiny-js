import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorLesserThanOrEqualToPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorLesserThanOrEqualToPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorLesserThanOrEqualToPlugin();
    const context: any = {};

    it("should apply lte correctly", () => {
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
                            lte: 100
                        }
                    }
                }
            ],
            filter: [],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple lte correctly", () => {
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
                            lte: 100
                        }
                    }
                },
                {
                    range: {
                        date: {
                            lte: to as any
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
