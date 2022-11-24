import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { applyFiltering } from "~/operations/entry/elasticsearch/filtering";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPlugins, Plugins, Fields, createFields } from "./mocks";

describe("equals filter", () => {
    let fields: Fields;
    let query: Query;
    let plugins: Plugins;

    beforeEach(() => {
        fields = createFields();
        query = createQuery();
        plugins = createPlugins();
    });

    it("should add equal filter - null", async () => {
        const where: CmsEntryListWhere = {
            title: null
        };

        applyFiltering({
            fields,
            query,
            where,
            operatorPlugins: plugins.operators,
            searchPlugins: plugins.search
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

        applyFiltering({
            fields,
            query,
            where,
            operatorPlugins: plugins.operators,
            searchPlugins: plugins.search
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

        applyFiltering({
            fields,
            query,
            where,
            operatorPlugins: plugins.operators,
            searchPlugins: plugins.search
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

        applyFiltering({
            fields,
            query,
            where,
            operatorPlugins: plugins.operators,
            searchPlugins: plugins.search
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
