import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { applyFiltering } from "~/operations/entry/elasticsearch/filtering";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPlugins, Plugins, Fields, createFields } from "./mocks";

describe("not equals filter", () => {
    let fields: Fields;
    let query: Query;
    let plugins: Plugins;

    beforeEach(() => {
        fields = createFields();
        query = createQuery();
        plugins = createPlugins();
    });

    it("should add not equal filter - null", async () => {
        const where: CmsEntryListWhere = {
            title_not: null
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
                    exists: {
                        field: "values.titleStorageId.keyword"
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
                    term: {
                        "values.titleStorageId.keyword": title
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
                        "values.isMarriedStorageId": false
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
            filter: [],
            must_not: [
                {
                    term: {
                        "values.ageStorageId": 2
                    }
                }
            ]
        };

        expect(query).toEqual(expected);
    });
});
