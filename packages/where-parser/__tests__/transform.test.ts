/* eslint-disable */
import { transform } from "../src/index";

describe("transform", () => {
    test("should properly transform simple condition", () => {
        const createdOnDate = new Date();
        const condition = {
            id: 1,
            parentId_eq: 999,
            title_contains: "text",
            createdOn_gt: createdOnDate,
            createdOn_not_lt: createdOnDate
        };

        const result = transform(condition);

        expect(result).toEqual({
            AND: [
                {
                    operation: "eq",
                    attr: "id",
                    value: 1
                },
                {
                    operation: "eq",
                    attr: "parentId",
                    value: 999
                },
                {
                    operation: "contains",
                    attr: "title",
                    value: "text"
                },
                {
                    operation: "gt",
                    attr: "createdOn",
                    value: createdOnDate
                },
                {
                    operation: "not_lt",
                    attr: "createdOn",
                    value: createdOnDate
                }
            ]
        });
    });
});
