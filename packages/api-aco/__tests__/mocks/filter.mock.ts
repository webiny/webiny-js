import { Operation } from "~/filter/filter.types";

export const filterMocks = {
    filterA: {
        id: "filter-a",
        name: "Filter A",
        description: "Filter description A",
        modelId: "demo-1",
        operation: Operation.AND,
        groups: [
            JSON.stringify({
                operation: Operation.AND,
                filters: [
                    {
                        field: "field-1",
                        condition: " ",
                        value: "value 1"
                    },
                    {
                        field: "field-2",
                        condition: "_not",
                        value: "value 2"
                    }
                ]
            })
        ]
    },
    filterB: {
        id: "filter-b",
        name: "Filter B",
        description: "Filter description B",
        modelId: "demo-1",
        operation: Operation.OR,
        groups: [
            JSON.stringify({
                operation: Operation.OR,
                filters: [
                    {
                        field: "field-1",
                        condition: " ",
                        value: "value 1"
                    },
                    {
                        field: "field-2",
                        condition: "_not",
                        value: "value 2"
                    }
                ]
            })
        ]
    },
    filterC: {
        id: "filter-c",
        name: "Filter C",
        description: "Filter description C",
        modelId: "demo-2",
        operation: Operation.AND,
        groups: [
            JSON.stringify({
                operation: Operation.OR,
                filters: [
                    {
                        field: "field-1",
                        condition: " ",
                        value: "value 1"
                    },
                    {
                        field: "field-2",
                        condition: "_not",
                        value: "value 2"
                    }
                ]
            })
        ]
    }
};
