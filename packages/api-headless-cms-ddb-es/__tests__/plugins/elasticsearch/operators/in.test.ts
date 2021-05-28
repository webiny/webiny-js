import { elasticsearchOperatorInPlugin } from "../../../../src/elasticsearch/operators/in";
import { createBlankQuery } from "../helpers";
import { ElasticsearchQuery } from "../../../../src/types";

describe("elasticsearchOperatorInPlugin", () => {
    const plugin = elasticsearchOperatorInPlugin();
    const context: any = {};

    it("should apply must in correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: ["John", "Johnny"],
            context
        });

        const expected: ElasticsearchQuery = {
            mustNot: [],
            must: [
                {
                    terms: {
                        ["name.keyword"]: ["John", "Johnny"]
                    }
                }
            ],
            match: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
