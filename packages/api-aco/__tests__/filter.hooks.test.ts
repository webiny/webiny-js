import { useGraphQlHandler } from "./utils/useGraphQlHandler";

import { assignFilterLifecycleEvents, tracker } from "./mocks/lifecycle.mock";
import { Operation } from "~/filter/filter.types";

const id = "filter-id";
const name = "Filter Lifecycle Events";
const namespace = "demo-lifecycle-events";
const operation = Operation.AND;
const groups = [
    {
        operation: Operation.OR,
        filters: [
            {
                field: "any-field",
                condition: "any-condition",
                value: "any-value"
            }
        ]
    }
];

describe("Filter Lifecycle Events", () => {
    const { aco } = useGraphQlHandler({
        plugins: [assignFilterLifecycleEvents()]
    });

    beforeEach(async () => {
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const [response] = await aco.createFilter({
            data: {
                id,
                name,
                namespace,
                operation,
                groups
            }
        });

        expect(response).toMatchObject({
            data: {
                aco: {
                    createFilter: {
                        data: {
                            id: expect.stringContaining(id),
                            name,
                            namespace,
                            operation,
                            groups
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("filter:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("filter:afterCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("filter:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("filter:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("filter:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("filter:afterDelete")).toEqual(false);
    });

    it("should trigger update lifecycle events", async () => {
        const [createResponse] = await aco.createFilter({
            data: {
                id,
                name,
                namespace,
                operation,
                groups
            }
        });

        tracker.reset();

        const [updateResponse] = await aco.updateFilter({
            id: createResponse.data.aco.createFilter.data.id,
            data: {
                name: `${name} updated`
            }
        });

        expect(updateResponse).toMatchObject({
            data: {
                aco: {
                    updateFilter: {
                        data: {
                            name: `${name} updated`
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("filter:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("filter:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("filter:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("filter:afterUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("filter:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("filter:afterDelete")).toEqual(false);
    });

    it("should trigger delete lifecycle events", async () => {
        const [createResponse] = await aco.createFilter({
            data: {
                id,
                name,
                namespace,
                operation,
                groups
            }
        });

        tracker.reset();

        const [deleteResponse] = await aco.deleteFilter({
            id: createResponse.data.aco.createFilter.data.id
        });
        expect(deleteResponse).toMatchObject({
            data: {
                aco: {
                    deleteFilter: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("filter:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("filter:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("filter:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("filter:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("filter:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("filter:afterDelete")).toEqual(true);
    });
});
