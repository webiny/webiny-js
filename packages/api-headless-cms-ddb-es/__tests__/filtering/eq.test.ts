import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { CreateExecFilteringResponse } from "~/operations/entry/elasticsearch/filtering";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPluginsContainer } from "./mocks";
import { createExecFiltering } from "./mocks/filtering";

describe("equals filter", () => {
    let query: Query;
    let execFiltering: CreateExecFilteringResponse;

    beforeEach(() => {
        query = createQuery();
        execFiltering = createExecFiltering({
            plugins: createPluginsContainer()
        });
    });

    it("should add equal filter - null", async () => {
        const where: CmsEntryListWhere = {
            title: null
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
                    exists: {
                        field: "values.titleStorageId.keyword"
                    }
                }
            ]
        };

        expect(query).toEqual(expected);
    });

    it("should add equal filter - string", async () => {
        const title = "Webiny Serverless";
        const where: CmsEntryListWhere = {
            title
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
                    term: {
                        "values.titleStorageId.keyword": title
                    }
                }
            ],
            must_not: []
        };

        expect(query).toEqual(expected);
    });

    it("should add equal filter - boolean", async () => {
        const where: CmsEntryListWhere = {
            isMarried: true
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
                    term: {
                        "values.isMarriedStorageId": true
                    }
                }
            ],
            must_not: []
        };

        expect(query).toEqual(expected);
    });

    it("should add equal filter - number", async () => {
        const where: CmsEntryListWhere = {
            age: 2
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
                    term: {
                        "values.ageStorageId": 2
                    }
                }
            ],
            must_not: []
        };

        expect(query).toEqual(expected);
    });
});
