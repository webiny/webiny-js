import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { applyFiltering } from "~/operations/entry/elasticsearch/filtering";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPlugins, Plugins, Fields, createFields } from "./mocks";

describe("in filter", () => {
    let fields: Fields;
    let query: Query;
    let plugins: Plugins;

    beforeEach(() => {
        fields = createFields();
        query = createQuery();
        plugins = createPlugins();
    });

    it("should add in filter - string only", async () => {
        const list = ["someId", "someOtherId", "anotherOtherId"];
        const where: CmsEntryListWhere = {
            id_in: list
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
                    terms: {
                        "idStorageId.keyword": list
                    }
                }
            ],
            must_not: []
        };

        expect(query).toEqual(expected);
    });

    it("should add in filter - string and number", async () => {
        const list: any = ["someId", "someOtherId", "anotherOtherId", 5];
        const where: CmsEntryListWhere = {
            id_in: list
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
                    terms: {
                        idStorageId: list
                    }
                }
            ],
            must_not: []
        };

        expect(query).toEqual(expected);
    });

    it("should throw error when input is not an array", async () => {
        const where: CmsEntryListWhere = {
            id_in: "" as any
        };

        expect(() => {
            applyFiltering({
                fields,
                query,
                where,
                operatorPlugins: plugins.operators,
                searchPlugins: plugins.search
            });
        }).toThrow(
            `You cannot filter field "id" with "in" operator and not send an array of values.`
        );
    });

    it("should throw error when input is an empty array", async () => {
        const where: CmsEntryListWhere = {
            id_in: []
        };

        expect(() => {
            applyFiltering({
                fields,
                query,
                where,
                operatorPlugins: plugins.operators,
                searchPlugins: plugins.search
            });
        }).toThrow(
            `You cannot filter field "id" with "in" operator and not send an array of values.`
        );
    });
});
