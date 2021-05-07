import { whereParser } from "../src/index";

describe("transform", () => {
    it("should properly parse simple condition without syntax keywords", () => {
        const createdOnDate = new Date();
        const where = {
            id: 1,
            parentId_eq: 999,
            title_contains: "text",
            createdOn_gt: createdOnDate,
            createdOn_not_lt: createdOnDate
        };

        const result = whereParser({
            attributes: ["id", "parentId", "title", "createdOn"],
            where
        });

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

    it("should properly parse simple AND condition", () => {
        const createdOnDate = new Date();
        const where = {
            AND: [
                {
                    id: 1
                },
                {
                    parentId_eq: 999
                },
                {
                    title_contains: "text"
                },
                {
                    createdOn_gt: createdOnDate
                },
                {
                    createdOn_not_lt: createdOnDate
                }
            ]
        };

        const result = whereParser({
            attributes: ["id", "parentId", "title", "createdOn"],
            where
        });

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

    it("should properly parse simple OR condition", () => {
        const createdOnDate = new Date();
        const where = {
            OR: [
                { id: 1 },
                { parentId_eq: 999 },
                { title_contains: "text" },
                { createdOn_gt: createdOnDate },
                { createdOn_not_lt: createdOnDate }
            ]
        };

        const result = whereParser({
            attributes: ["id", "parentId", "title", "createdOn"],
            where
        });

        expect(result).toEqual({
            OR: [
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
