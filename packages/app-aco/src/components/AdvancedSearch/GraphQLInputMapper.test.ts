import { GraphQLInputMapper } from "./GraphQLInputMapper";
import { Operation, FilterDTO } from "./domain";

describe("GraphQLInputMapper", () => {
    it("should return a GraphQL formatted output based on the received FilterDTO", () => {
        const filterDTO: FilterDTO = {
            id: "any-id",
            name: "Untitled",
            operation: Operation.AND,
            groups: [
                {
                    operation: Operation.AND,
                    filters: [
                        {
                            field: "field-1",
                            condition: " ",
                            value: "value-1"
                        },
                        {
                            field: "field-2",
                            condition: "_not",
                            value: "value-2"
                        }
                    ]
                },
                {
                    operation: Operation.OR,
                    filters: [
                        {
                            field: "field-3",
                            condition: "_startsWith",
                            value: "value-3"
                        },
                        {
                            field: "field-4",
                            condition: "_not_contains",
                            value: "value-4"
                        },
                        {
                            field: "boolean-field-true",
                            condition: " ",
                            value: "true"
                        },
                        {
                            field: "boolean-field-false",
                            condition: " ",
                            value: "false"
                        }
                    ]
                }
            ]
        };

        const output = GraphQLInputMapper.toGraphQL(filterDTO);

        expect(output).toEqual({
            [Operation.AND]: [
                {
                    [Operation.AND]: [
                        {
                            "field-1": "value-1"
                        },
                        {
                            "field-2_not": "value-2"
                        }
                    ]
                },
                {
                    [Operation.OR]: [
                        {
                            "field-3_startsWith": "value-3"
                        },
                        {
                            "field-4_not_contains": "value-4"
                        },
                        {
                            "boolean-field-true": true
                        },
                        {
                            "boolean-field-false": false
                        }
                    ]
                }
            ]
        });
    });
});
