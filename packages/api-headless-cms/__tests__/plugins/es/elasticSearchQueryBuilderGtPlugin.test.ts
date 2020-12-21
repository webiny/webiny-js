import { elasticSearchQueryBuilderGtPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderGtPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticSearchQueryType } from "@webiny/api-headless-cms/types";

describe("elasticSearchQueryBuilderGtPlugin", () => {
    const plugin = elasticSearchQueryBuilderGtPlugin();

    it("should apply gt correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            field: "id"
        });

        const expected: ElasticSearchQueryType = {
            mustNot: [],
            must: [
                {
                    range: {
                        id: {
                            gt: 100
                        }
                    }
                }
            ],
            match: [],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple gt correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            field: "id"
        });

        const from = new Date();
        plugin.apply(query, {
            value: from,
            field: "date"
        });

        const expected: ElasticSearchQueryType = {
            mustNot: [],
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
                            gt: from
                        }
                    }
                }
            ],
            match: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
