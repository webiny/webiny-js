import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPluginsContainer } from "./mocks";
import { CreateExecFilteringResponse } from "~/operations/entry/elasticsearch/filtering";
import { createExecFiltering } from "./mocks/filtering";

describe("in filter", () => {
    let query: Query;
    let execFiltering: CreateExecFilteringResponse;

    beforeEach(() => {
        query = createQuery();
        execFiltering = createExecFiltering({
            plugins: createPluginsContainer()
        });
    });

    it("should add in filter - string only", async () => {
        const list = ["someId", "someOtherId", "anotherOtherId"];
        const where: CmsEntryListWhere = {
            id_in: list
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
                    terms: {
                        "id.keyword": list
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

        execFiltering({
            query,
            where
        });

        const expected: ElasticsearchBoolQueryConfig = {
            should: [],
            must: [],
            filter: [
                {
                    terms: {
                        id: list
                    }
                }
            ],
            must_not: []
        };

        expect(query).toEqual(expected);
    });

    it("should throw error when input is not an array", async () => {
        const where: CmsEntryListWhere = {
            /**
             * We expect error because string cannot be passed into the _in operator.
             * We are testing for the error throwing.
             */
            // @ts-expect-error
            id_in: ""
        };

        expect(() => {
            execFiltering({
                query,
                where
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
            execFiltering({
                query,
                where
            });
        }).toThrow(
            `You cannot filter field "id" with "in" operator and not send an array of values.`
        );
    });
});
