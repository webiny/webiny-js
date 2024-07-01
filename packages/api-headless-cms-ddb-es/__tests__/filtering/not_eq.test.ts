import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPluginsContainer } from "./mocks";
import { CreateExecFilteringResponse } from "~/operations/entry/elasticsearch/filtering";
import { createExecFiltering } from "./mocks/filtering";

describe("not equals filter", () => {
    let query: Query;
    let execFiltering: CreateExecFilteringResponse;

    beforeEach(() => {
        query = createQuery();
        execFiltering = createExecFiltering({
            plugins: createPluginsContainer()
        });
    });

    it("should add not equal filter - null", async () => {
        const where: CmsEntryListWhere = {
            title_not: null
        };

        execFiltering({
            query,
            where
        });

        const expected: ElasticsearchBoolQueryConfig = {
            should: [],
            must: [],
            filter: [
                {
                    exists: {
                        field: "values.title.keyword"
                    }
                }
            ],
            must_not: []
        };

        expect(query).toEqual(expected);
    });

    it("should add not equal filter - string", async () => {
        const title = "Webiny Serverless";
        const where: CmsEntryListWhere = {
            title_not: title
        };

        execFiltering({
            query,
            where
        });

        const expected: ElasticsearchBoolQueryConfig = {
            should: [],
            must: [],
            filter: [],
            must_not: [
                {
                    term: {
                        "values.title.keyword": title
                    }
                }
            ]
        };

        expect(query).toEqual(expected);
    });

    it("should add not equal filter - boolean", async () => {
        const where: CmsEntryListWhere = {
            isMarried_not: true
        };

        execFiltering({
            query,
            where
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must: [],
            should: [],
            filter: [
                {
                    bool: {
                        must_not: {
                            term: {
                                "values.isMarried": true
                            }
                        }
                    }
                }
            ],
            must_not: []
        };

        expect(query).toEqual(expected);
    });

    it("should add not equal filter - number", async () => {
        const where: CmsEntryListWhere = {
            age_not: 2
        };

        execFiltering({
            query,
            where
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must: [],
            should: [],
            filter: [],
            must_not: [
                {
                    term: {
                        "values.age": 2
                    }
                }
            ]
        };

        expect(query).toEqual(expected);
    });
});
