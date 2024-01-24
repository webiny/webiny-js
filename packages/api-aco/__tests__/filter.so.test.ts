import { filterMocks } from "./mocks/filter.mock";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { userMock } from "~tests/mocks/user.mock";
import { Operation } from "~/filter/filter.types";

describe("`filter` CRUD", () => {
    const { aco } = useGraphQlHandler();

    it("should be able to create, read, update and delete `filter`", async () => {
        // Let's create some filters.
        const [responseA] = await aco.createFilter({ data: filterMocks.filterA });
        const filterA = responseA.data.aco.createFilter.data;
        expect(filterA).toEqual({
            ...filterMocks.filterA,
            id: filterA.id,
            createdBy: userMock
        });

        const [responseB] = await aco.createFilter({ data: filterMocks.filterB });
        const filterB = responseB.data.aco.createFilter.data;
        expect(filterB).toEqual({
            ...filterMocks.filterB,
            id: filterB.id,
            createdBy: userMock
        });

        const [responseC] = await aco.createFilter({ data: filterMocks.filterC });
        const filterC = responseC.data.aco.createFilter.data;
        expect(filterC).toEqual({
            ...filterMocks.filterC,
            id: filterC.id,
            createdBy: userMock
        });

        // Let's check whether both of the filter exists, listing them by `namespace`.
        const [listResponse1] = await aco.listFilters({
            where: { namespace: "demo-1" }
        });

        expect(listResponse1).toEqual({
            data: {
                aco: {
                    listFilters: {
                        data: [
                            {
                                ...filterMocks.filterB,
                                createdBy: userMock,
                                id: filterB.id
                            },
                            {
                                ...filterMocks.filterA,
                                createdBy: userMock,
                                id: filterA.id
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        const [listResponse2] = await aco.listFilters({
            where: { namespace: "demo-2" }
        });

        expect(listResponse2.data.aco.listFilters).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ ...filterMocks.filterC, id: filterC.id })
                ]),
                error: null
            })
        );

        // Let's update the "filter-b".
        const update = {
            name: "Filter B - UPDATED",
            operation: Operation.AND
        };

        const [updateB] = await aco.updateFilter({
            id: filterB.id,
            data: update
        });

        expect(updateB).toEqual({
            data: {
                aco: {
                    updateFilter: {
                        data: {
                            ...filterB,
                            ...update
                        },
                        error: null
                    }
                }
            }
        });

        // Let's delete "filter-b"
        const [deleteB] = await aco.deleteFilter({
            id: filterB.id
        });

        expect(deleteB).toEqual({
            data: {
                aco: {
                    deleteFilter: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Should not find "filter-b"
        const [getB] = await aco.getFilter({ id: filterB.id });

        expect(getB).toMatchObject({
            data: {
                aco: {
                    getFilter: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null
                        }
                    }
                }
            }
        });

        // Should find "filter-a" by id
        const [getA] = await aco.getFilter({ id: filterA.id });

        expect(getA).toEqual({
            data: {
                aco: {
                    getFilter: {
                        data: filterA,
                        error: null
                    }
                }
            }
        });
    });

    it("should not allow creating a `filter` with no `name` provided", async () => {
        const [response] = await aco.createFilter({
            data: {
                ...filterMocks.filterA,
                name: ""
            }
        });

        expect(response).toEqual({
            data: {
                aco: {
                    createFilter: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED",
                            message: "Validation failed.",
                            data: [
                                {
                                    error: "Value is required.",
                                    fieldId: "name",
                                    id: "name",
                                    parents: [],
                                    storageId: "text@name"
                                }
                            ]
                        }
                    }
                }
            }
        });
    });

    it("should not allow creating a `filter` with no `namespace` provided", async () => {
        const [response] = await aco.createFilter({
            data: {
                ...filterMocks.filterA,
                namespace: ""
            }
        });

        expect(response).toEqual({
            data: {
                aco: {
                    createFilter: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED",
                            message: "Validation failed.",
                            data: [
                                {
                                    error: "Value is required.",
                                    fieldId: "namespace",
                                    id: "namespace",
                                    parents: [],
                                    storageId: "text@namespace"
                                }
                            ]
                        }
                    }
                }
            }
        });
    });

    it("should not allow creating a `filter` with no `operation` provided", async () => {
        const [response] = await aco.createFilter({
            data: {
                ...filterMocks.filterA,
                operation: ""
            }
        });

        expect(response).toEqual({
            errors: expect.any(Array)
        });
    });

    it("should not allow creating a `filter` with empty `groups` provided", async () => {
        const [response] = await aco.createFilter({
            data: {
                ...filterMocks.filterA,
                groups: []
            }
        });

        expect(response).toEqual({
            data: {
                aco: {
                    createFilter: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED",
                            message: "Validation failed.",
                            data: [
                                {
                                    error: "At least one group is required.",
                                    fieldId: "groups",
                                    id: "groups",
                                    parents: [],
                                    storageId: "object@groups"
                                }
                            ]
                        }
                    }
                }
            }
        });
    });

    it("should not allow creating a `filter` with empty `groups.operation` provided", async () => {
        const [response] = await aco.createFilter({
            data: {
                ...filterMocks.filterA,
                groups: [
                    {
                        operation: "",
                        filters: [
                            {
                                field: "any",
                                condition: "any",
                                value: "any"
                            }
                        ]
                    }
                ]
            }
        });

        expect(response).toEqual({
            errors: [
                {
                    locations: expect.any(Array),
                    message:
                        'Variable "$data" got invalid value "" at "data.groups[0].operation"; Value "" does not exist in "OperationEnum" enum.'
                }
            ]
        });
    });

    it("should not allow creating a `filter` with empty `groups.filters` provided", async () => {
        const [response] = await aco.createFilter({
            data: {
                ...filterMocks.filterA,
                groups: [
                    {
                        operation: Operation.AND,
                        filters: []
                    }
                ]
            }
        });

        expect(response).toEqual({
            data: {
                aco: {
                    createFilter: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED",
                            message: "Validation failed.",
                            data: [
                                {
                                    error: "At least one filter is required.",
                                    fieldId: "filters",
                                    id: "filters",
                                    parents: ["groups", "0"],
                                    storageId: "object@filters"
                                }
                            ]
                        }
                    }
                }
            }
        });
    });

    it("should not allow creating a `filter` with wrong `groups.filters` provided", async () => {
        const [response] = await aco.createFilter({
            data: {
                ...filterMocks.filterA,
                groups: [
                    {
                        operation: Operation.AND,
                        filters: [
                            {
                                field: "",
                                condition: "",
                                value: ""
                            }
                        ]
                    }
                ]
            }
        });

        expect(response).toEqual({
            data: {
                aco: {
                    createFilter: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED",
                            message: "Validation failed.",
                            data: [
                                {
                                    error: "Value is required.",
                                    fieldId: "field",
                                    id: "field",
                                    parents: ["groups", "0", "filters", "0"],
                                    storageId: "text@field"
                                },
                                {
                                    error: "Value is required.",
                                    fieldId: "condition",
                                    id: "condition",
                                    parents: ["groups", "0", "filters", "0"],
                                    storageId: "text@condition"
                                },
                                {
                                    error: "Value is required.",
                                    fieldId: "value",
                                    id: "value",
                                    parents: ["groups", "0", "filters", "0"],
                                    storageId: "text@value"
                                }
                            ]
                        }
                    }
                }
            }
        });
    });

    it("should not allow updating a non-existing `filter`", async () => {
        const id = "any-id";
        const [result] = await aco.updateFilter({
            id,
            data: {
                name: "Any name"
            }
        });

        expect(result.data.aco.updateFilter).toEqual({
            data: null,
            error: {
                code: "NOT_FOUND",
                message: 'Entry by ID "any-id" not found.',
                data: null
            }
        });
    });

    it("should not list filters created by other users", async () => {
        const { aco: otherAco } = useGraphQlHandler({
            identity: {
                id: "abcdefgh",
                type: "admin",
                displayName: "Smith Smith"
            }
        });
        const { aco } = useGraphQlHandler();

        // Let's create some filters.
        await aco.createFilter({ data: filterMocks.filterA });

        const [listResponse] = await otherAco.listFilters({
            where: { namespace: "demo-1" }
        });

        expect(listResponse.data.aco.listFilters).toEqual(
            expect.objectContaining({
                data: [],
                error: null
            })
        );
    });

    it("should enforce security rules", async () => {
        const { aco: anonymousAco } = useGraphQlHandler({ identity: null });
        const { aco } = useGraphQlHandler();

        const notAuthorizedResponse = {
            data: null,
            error: {
                code: "SECURITY_NOT_AUTHORIZED",
                message: "Not authorized!",
                data: null
            }
        };

        // Create with anonymous identity
        {
            const [responseA] = await anonymousAco.createFilter({ data: filterMocks.filterA });
            const filterA = responseA.data.aco.createFilter;
            expect(filterA).toEqual(notAuthorizedResponse);
        }

        // Let's create some a dummy filter
        const [responseA] = await aco.createFilter({ data: filterMocks.filterA });
        const filterA = responseA.data.aco.createFilter.data;
        expect(filterA).toEqual({
            ...filterMocks.filterA,
            id: filterA.id,
            createdBy: userMock
        });

        // List with anonymous identity
        {
            const [listResponse] = await anonymousAco.listFilters({
                where: { namespace: "demo-1" }
            });
            expect(listResponse.data.aco.listFilters).toEqual(
                expect.objectContaining(notAuthorizedResponse)
            );
        }

        // Get with anonymous identity
        {
            const [getResponse] = await anonymousAco.getFilter({ id: filterA.id });
            expect(getResponse.data.aco.getFilter).toEqual(
                expect.objectContaining(notAuthorizedResponse)
            );
        }

        // Update with anonymous identity
        {
            const [updateResponse] = await anonymousAco.updateFilter({
                id: filterA.id,
                data: { name: `${filterA.title} + update` }
            });
            expect(updateResponse.data.aco.updateFilter).toEqual(
                expect.objectContaining(notAuthorizedResponse)
            );
        }

        // Delete with anonymous identity
        {
            const [deleteResponse] = await anonymousAco.deleteFilter({
                id: filterA.id
            });
            expect(deleteResponse.data.aco.deleteFilter).toEqual(
                expect.objectContaining(notAuthorizedResponse)
            );
        }
    });
});
