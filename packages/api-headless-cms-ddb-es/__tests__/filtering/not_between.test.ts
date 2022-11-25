import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { applyFiltering } from "~/operations/entry/elasticsearch/filtering";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPlugins, Plugins, Fields, createFields } from "./mocks";

describe("not_between filter", () => {
    let fields: Fields;
    let query: Query;
    let plugins: Plugins;

    beforeEach(() => {
        fields = createFields();
        query = createQuery();
        plugins = createPlugins();
    });

    it("should add not_between filter", async () => {
        const where: CmsEntryListWhere = {
            age_not_between: [18, 55]
        };

        applyFiltering({
            plugins: plugins.container,
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
                    range: {
                        "values.ageStorageId": {
                            gte: 18,
                            lte: 55
                        }
                    }
                }
            ]
        };

        expect(query).toEqual(expected);
    });

    it("should add not_between filter - date", async () => {
        const where: CmsEntryListWhere = {
            date_not_between: ["2022-01-01T00:00:00.000Z", "2022-12-31T23:59:59.999Z"]
        };

        applyFiltering({
            plugins: plugins.container,
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
                    range: {
                        "values.dateStorageId": {
                            gte: "2022-01-01T00:00:00.000Z",
                            lte: "2022-12-31T23:59:59.999Z"
                        }
                    }
                }
            ]
        };

        expect(query).toEqual(expected);
    });

    it("should throw error if array was not sent as filter value", async () => {
        const where: CmsEntryListWhere = {
            age_not_between: 17
        };

        expect(() => {
            applyFiltering({
                plugins: plugins.container,
                fields,
                query,
                where,
                operatorPlugins: plugins.operators,
                searchPlugins: plugins.search
            });
        }).toThrow(
            `You cannot filter field path "age" with "not_between" query and not send an array of values.`
        );
    });

    const wrongTupleValues = [[[]], [[17]], [[17, 177, 1777]]];
    it.each(wrongTupleValues)("should throw error if a tuple was not sent - %s", async value => {
        const where: CmsEntryListWhere = {
            age_not_between: value
        };

        expect(() => {
            applyFiltering({
                plugins: plugins.container,
                fields,
                query,
                where,
                operatorPlugins: plugins.operators,
                searchPlugins: plugins.search
            });
        }).toThrow(`You must pass 2 values in the array for field path "age" filtering.`);
    });
});
