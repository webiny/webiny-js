import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPluginsContainer } from "./mocks";
import { createExecFiltering, CreateExecFilteringResponse } from "./mocks/filtering";

describe("not_between filter", () => {
    let query: Query;
    let execFiltering: CreateExecFilteringResponse;

    beforeEach(() => {
        query = createQuery();
        execFiltering = createExecFiltering({
            plugins: createPluginsContainer()
        });
    });

    it("should add not_between filter", async () => {
        const where: CmsEntryListWhere = {
            age_not_between: [18, 55]
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
                    range: {
                        "values.age": {
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
                    range: {
                        "values.date": {
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
            execFiltering({
                query,
                where
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
            execFiltering({
                query,
                where
            });
        }).toThrow(`You must pass 2 values in the array for field path "age" filtering.`);
    });
});
