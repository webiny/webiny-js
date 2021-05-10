import { parseWhere } from "../src/index";

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

        const result = parseWhere({
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
            AND: {
                id: 1,
                parentId_eq: 999,
                title_contains: "text",
                createdOn_gt: createdOnDate,
                createdOn_not_lt: createdOnDate
            }
        };

        const result = parseWhere({
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
            OR: {
                id: 1,
                parentId_eq: 999,
                title_contains: "text",
                createdOn_gt: createdOnDate,
                createdOn_not_lt: createdOnDate
            }
        };

        const result = parseWhere({
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

    it("should properly parse attributes with addition to OR keyword", () => {
        const where = {
            userId: 1,
            OR: [{ text_contains: "moon" }, { text_contains: "space" }]
        };

        const result = parseWhere({
            attributes: ["id", "text"],
            where
        });

        expect(result).toEqual({
            AND: [
                {
                    operation: "eq",
                    attr: "userId",
                    value: 1
                },
                {
                    OR: [
                        {
                            operation: "contains",
                            attr: "text",
                            value: "moon"
                        },
                        {
                            operation: "contains",
                            attr: "text",
                            value: "space"
                        }
                    ]
                }
            ]
        });
    });

    it("should properly parse attributes with both AND and OR syntax in the first level", () => {
        const where = {
            AND: {
                id: 1,
                text_contains: "travel"
            },
            OR: [{ text_contains: "moon" }, { text_contains: "mars" }]
        };

        const result = parseWhere({
            attributes: ["id", "text"],
            where
        });

        expect(result).toEqual({
            AND: [
                {
                    attr: "id",
                    operation: "eq",
                    value: 1
                },
                {
                    attr: "text",
                    operation: "contains",
                    value: "travel"
                }
            ],
            OR: [
                {
                    attr: "text",
                    operation: "contains",
                    value: "moon"
                },
                {
                    attr: "text",
                    operation: "contains",
                    value: "mars"
                }
            ]
        });
    });

    it("should properly parse attributes with addition to OR keyword + nested AND keyword", () => {
        const where = {
            userId: 1,
            OR: [
                { text_contains: "moon" },
                { text_contains: "space" },
                {
                    AND: {
                        text_contains: "mars",
                        category: "travel"
                    }
                }
            ]
        };

        const result = parseWhere({
            attributes: ["id", "text"],
            where
        });

        expect(result).toEqual({
            AND: [
                {
                    operation: "eq",
                    attr: "userId",
                    value: 1
                },
                {
                    OR: [
                        {
                            operation: "contains",
                            attr: "text",
                            value: "moon"
                        },
                        {
                            operation: "contains",
                            attr: "text",
                            value: "space"
                        },
                        {
                            AND: [
                                {
                                    operation: "contains",
                                    attr: "text",
                                    value: "mars"
                                },
                                {
                                    operation: "eq",
                                    attr: "category",
                                    value: "travel"
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    });
});
