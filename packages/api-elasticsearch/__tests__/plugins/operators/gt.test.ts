import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorGreaterThanPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorGreaterThanPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorGreaterThanPlugin();

    it("should apply gt correctly", () => {
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
                            gt: 100
                        }
                    }
                }
            ],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple gt correctly", () => {
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
                            gt: 100
                        }
                    }
                },
                {
                    range: {
                        date: {
                            gt: from
                        }
                    }
                }
            ],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
