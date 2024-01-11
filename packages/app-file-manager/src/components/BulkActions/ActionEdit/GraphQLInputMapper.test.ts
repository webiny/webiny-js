import { GraphQLInputMapper } from "./GraphQLInputMapper";
import { BatchDTO, OperatorType } from "~/components/BulkActions/ActionEdit/domain";
import { FileItem } from "@webiny/app-admin/types";

describe("GraphQLInputMapper", () => {
    it("should return a GraphQL formatted output based on the received BatchDTO and previous data", () => {
        const data: FileItem["extensions"] = {
            field1: "old-field1",
            field2: "old-field2",
            field3: ["old-field3"]
        };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "field1",
                    operator: OperatorType.OVERRIDE,
                    value: {
                        field1: "new-field1"
                    }
                },
                {
                    field: "field2",
                    operator: OperatorType.REMOVE
                },
                {
                    field: "field3",
                    operator: OperatorType.APPEND,
                    value: {
                        field3: ["new-field3-1", "new-field3-2"]
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.toGraphQLExtensions(data, batch);

        expect(output).toEqual({
            field1: "new-field1",
            field2: null,
            field3: ["old-field3", "new-field3-1", "new-field3-2"]
        });
    });

    it("should not override data for fields not defined in the batch", () => {
        const data: FileItem["extensions"] = {
            field1: "old-field1",
            field2: "old-field2"
        };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "field1",
                    operator: OperatorType.OVERRIDE,
                    value: {
                        field1: "new-field1"
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.toGraphQLExtensions(data, batch);

        expect(output).toEqual({
            field1: "new-field1",
            field2: "old-field2"
        });
    });

    it("should not OVERRIDE data in case of nullish value", () => {
        const data: FileItem["extensions"] = {
            field1: "old-field-1"
        };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "field1",
                    operator: OperatorType.OVERRIDE,
                    value: {
                        field1: null
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.toGraphQLExtensions(data, batch);

        expect(output).toEqual({
            field1: "old-field-1"
        });
    });

    it("should not APPEND data in case of nullish value", () => {
        const data: FileItem["extensions"] = {
            field1: "old-field-1"
        };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "field1",
                    operator: OperatorType.APPEND,
                    value: {
                        field1: null
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.toGraphQLExtensions(data, batch);

        expect(output).toEqual({
            field1: "old-field-1"
        });
    });

    it("should not APPEND data in case of non-array value", () => {
        const data: FileItem["extensions"] = {
            field1: "old-field-1"
        };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "field1",
                    operator: OperatorType.APPEND,
                    value: {
                        field1: "any-string"
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.toGraphQLExtensions(data, batch);

        expect(output).toEqual({
            field1: "old-field-1"
        });
    });

    it("should APPEND new data to non existing envelope", () => {
        const data: FileItem["extensions"] = {};

        const batch: BatchDTO = {
            operations: [
                {
                    field: "field1",
                    operator: OperatorType.APPEND,
                    value: {
                        field1: ["new-field1-1", "new-field1-2"]
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.toGraphQLExtensions(data, batch);

        expect(output).toEqual({
            field1: ["new-field1-1", "new-field1-2"]
        });
    });

    it("should APPEND new data for fields with nullish value", () => {
        const data: FileItem["extensions"] = {
            field1: null
        };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "field1",
                    operator: OperatorType.APPEND,
                    value: {
                        field1: ["new-field1-1", "new-field1-2"]
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.toGraphQLExtensions(data, batch);

        expect(output).toEqual({
            field1: ["new-field1-1", "new-field1-2"]
        });
    });

    it("should return existing data in case of invalid operation", () => {
        const data: FileItem["extensions"] = {
            field1: "old-field1"
        };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "field1",
                    operator: "ANY-OPERATION",
                    value: {
                        field1: "new-field1"
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.toGraphQLExtensions(data, batch);

        expect(output).toEqual({
            field1: "old-field1"
        });
    });
});
