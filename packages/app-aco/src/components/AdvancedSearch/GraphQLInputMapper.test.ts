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

    it("should return a GraphQL formatted output and support nested objects", () => {
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
                        },
                        {
                            field: "field-3.entryId",
                            condition: " ",
                            value: JSON.stringify({ entryId: "value-3", modelId: "any-modelId" })
                        },
                        {
                            field: "field-4.entryId",
                            condition: "_not",
                            value: JSON.stringify({ entryId: "value-4", modelId: "any-modelId" })
                        },
                        {
                            field: "field-5.sub-field.entryId",
                            condition: " ",
                            value: JSON.stringify({
                                "sub-field": { entryId: "value-5", modelId: "any-modelId" }
                            })
                        },
                        {
                            field: "field-6.sub-field.entryId",
                            condition: "_not",
                            value: JSON.stringify({
                                "sub-field": { entryId: "value-6", modelId: "any-modelId" }
                            })
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
                        },
                        {
                            "field-3": {
                                entryId: "value-3"
                            }
                        },
                        {
                            "field-4": {
                                entryId_not: "value-4"
                            }
                        },
                        {
                            "field-5": {
                                "sub-field": {
                                    entryId: "value-5"
                                }
                            }
                        },
                        {
                            "field-6": {
                                "sub-field": {
                                    entryId_not: "value-6"
                                }
                            }
                        }
                    ]
                }
            ]
        });
    });
});
