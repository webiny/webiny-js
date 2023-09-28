import { Operation } from "~/filter/filter.types";

export const filterMocks = {
    filterA: {
        name: "Filter A",
        model: "demo-1",
        operation: Operation.AND,
        groups: [
            {
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
            }
        ]
    },
    filterB: {
        name: "Filter B",
        model: "demo-1",
        operation: Operation.OR,
        groups: [
            {
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
            }
        ]
    },
    filterC: {
        name: "Filter C",
        model: "demo-2",
        operation: Operation.AND,
        groups: [
            {
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
            }
        ]
    }
};
