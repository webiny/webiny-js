import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorGreaterThanPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorGreaterThanPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorGreaterThanPlugin();
    const context: any = {};

    it("should apply gt correctly", () => {
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
                            gt: 100
                        }
                    }
                }
            ],
            filter: [],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple gt correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            path: "id",
            basePath: "id",
            context,
            keyword: false
        });

        const from = new Date();
        plugin.apply(query, {
            value: from,
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
                            gt: 100
                        }
                    }
                },
                {
                    range: {
                        date: {
                            gt: from as any
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
