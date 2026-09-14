import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "~tests/testHelpers/useHandler.js";
import { CmsWhereMapper } from "~/features/whereMapper/abstractions.js";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler.js";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";
import type { CmsModel } from "~/types/index.js";

describe("Where mapper for custom GraphQL where input", async () => {
    const manager = useCategoryManageHandler({
        path: "manage"
    });
    const handler = useHandler({
        path: "manage",
        plugins: []
    });

    let model: CmsModel;

    beforeEach(async () => {
        const result = await setupGroupAndModels({
            manager,
            models: ["category"]
        });
        model = Object.freeze(result.getModel("category"));
    });

    const resolveMapper = async () => {
        const context = await handler.handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-tenant": "root"
            }
        });

        return context.container.resolve(CmsWhereMapper);
    };

    it("should have mapper resolved", async () => {
        const mapper = await resolveMapper();
        expect(mapper).not.toBeUndefined();
    });

    it("should map system fields", async () => {
        const mapper = await resolveMapper();

        const input = Object.freeze({
            id: "123",
            id_not: "234",
            id_in: ["123", "345"],
            id_not_in: ["567", "890"],
            createdBy: "me",
            createdBy_not: "you",
            createdBy_in: ["me", "someone"],
            createdBy_not_in: ["them", "others"]
        });

        const result = mapper.map({
            input,
            fields: model.fields
        });
        expect(result).toEqual({
            ...input
        });
    });

    it("should map model fields", async () => {
        const mapper = await resolveMapper();

        const input = {
            title: "123",
            title_contains: "me",
            title_not_contains: "you",
            title_in: ["a", "b", "c"],
            title_not_in: ["x", "y", "z"],
            createdBy: "me"
        };

        const result = mapper.map({
            input,
            fields: model.fields
        });
        expect(result).toEqual({
            values: {
                title: "123",
                title_contains: "me",
                title_not_contains: "you",
                title_in: ["a", "b", "c"],
                title_not_in: ["x", "y", "z"]
            },
            createdBy: "me"
        });
    });

    it("should map root level logical operators", async () => {
        const mapper = await resolveMapper();

        const input = {
            id_not: "1",
            OR: [
                {
                    title: "First"
                },
                {
                    createdBy_not: "you"
                }
            ],
            AND: [
                {
                    createdBy: "me"
                },
                {
                    title: "Second"
                }
            ]
        };

        const result = mapper.map({
            input,
            fields: model.fields
        });

        expect(result).toEqual({
            id_not: "1",
            OR: [
                {
                    values: {
                        title: "First"
                    }
                },
                {
                    createdBy_not: "you"
                }
            ],
            AND: [
                {
                    createdBy: "me"
                },
                {
                    values: {
                        title: "Second"
                    }
                }
            ]
        });
    });

    it("should map deeply nested logical operators", async () => {
        const mapper = await resolveMapper();

        const input = {
            OR: [
                {
                    AND: [
                        {
                            title: "First"
                        },
                        {
                            createdBy_not: "you"
                        }
                    ]
                },
                {
                    AND: [
                        {
                            createdBy: "me"
                        },
                        {
                            title: "Second"
                        }
                    ]
                },
                {
                    OR: [
                        {
                            title_contains: "hello"
                        },
                        {
                            title_not_contains: "world"
                        },
                        {
                            AND: [
                                {
                                    id_in: ["1", "2", "3"]
                                },
                                {
                                    id_not_in: ["4", "5", "6"]
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const result = mapper.map({
            input,
            fields: model.fields
        });

        expect(result).toEqual({
            OR: [
                {
                    AND: [
                        {
                            values: {
                                title: "First"
                            }
                        },
                        {
                            createdBy_not: "you"
                        }
                    ]
                },
                {
                    AND: [
                        {
                            createdBy: "me"
                        },
                        {
                            values: {
                                title: "Second"
                            }
                        }
                    ]
                },
                {
                    OR: [
                        {
                            values: {
                                title_contains: "hello"
                            }
                        },
                        {
                            values: {
                                title_not_contains: "world"
                            }
                        },
                        {
                            AND: [
                                {
                                    id_in: ["1", "2", "3"]
                                },
                                {
                                    id_not_in: ["4", "5", "6"]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    });
    /*
     * Field IDs containing an underscore. The mapper used to read the segment before the first `_`
     * as the field name, so `on_sale` was looked up as `on`, which does not exist: the filter stayed
     * at the top level instead of nesting, and the CMS rejected it.
     *
     * Synthetic fields rather than the category model, because the point is the shape of the ID.
     */
    describe("field IDs containing an underscore", () => {
        const fields = [
            { fieldId: "price" },
            { fieldId: "price_range" },
            { fieldId: "on_sale" }
        ] as CmsModel["fields"];

        it("should nest an underscored field", async () => {
            const mapper = await resolveMapper();

            expect(mapper.map({ input: { on_sale: true }, fields })).toEqual({
                values: { on_sale: true }
            });
        });

        it("should nest an underscored field carrying an operator", async () => {
            const mapper = await resolveMapper();

            expect(mapper.map({ input: { on_sale_not: true }, fields })).toEqual({
                values: { on_sale_not: true }
            });
        });

        it("should prefer the longest matching field ID", async () => {
            const mapper = await resolveMapper();

            // `price_range` must win over `price` plus a `_range` that is not an operator.
            expect(mapper.map({ input: { price_range: "high" }, fields })).toEqual({
                values: { price_range: "high" }
            });
        });

        it("should leave a key matching no field at the top level", async () => {
            const mapper = await resolveMapper();

            expect(mapper.map({ input: { on_hold: true }, fields })).toEqual({ on_hold: true });
        });
    });

    /*
     * An explicit `values` object alongside flat field keys. Assigning rather than merging dropped
     * whichever of the two arrived first, so the result depended on key order.
     */
    describe("an explicit `values` object", () => {
        const fields = [{ fieldId: "title" }] as CmsModel["fields"];

        it("should merge flat fields into it when it comes first", async () => {
            const mapper = await resolveMapper();

            expect(mapper.map({ input: { values: { a: 1 }, title: "x" }, fields })).toEqual({
                values: { a: 1, title: "x" }
            });
        });

        it("should merge into it when the flat field comes first", async () => {
            const mapper = await resolveMapper();

            expect(mapper.map({ input: { title: "x", values: { a: 1 } }, fields })).toEqual({
                values: { a: 1, title: "x" }
            });
        });
    });
});
