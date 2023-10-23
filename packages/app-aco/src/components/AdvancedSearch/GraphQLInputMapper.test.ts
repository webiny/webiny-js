import { GraphQLInputMapper } from "./GraphQLInputMapper";
import { Operation, QueryObjectDTO } from "./domain";

describe("GraphQLInputMapper", () => {
    it("should return a GraphQL formatted output based on the received queryObject", () => {
        const queryObjectDTO: QueryObjectDTO = {
            id: "any-id",
            name: "Untitled",
            namespace: "any-namespace",
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
                        }
                    ]
                }
            ]
        };

        const output = GraphQLInputMapper.toGraphQL(queryObjectDTO);

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
                        }
                    ]
                }
            ]
        });
    });
});
