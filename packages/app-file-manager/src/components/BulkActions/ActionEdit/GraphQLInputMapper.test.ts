import { GraphQLInputMapper } from "./GraphQLInputMapper";
import { BatchDTO, OperatorType } from "~/components/BulkActions/ActionEdit/domain";
import { FileItem } from "@webiny/app-admin/types";

const fileMock: FileItem = {
    id: "12345678",
    createdOn: new Date().toISOString(),
    savedOn: new Date().toISOString(),
    location: {
        folderId: "root"
    },
    createdBy: {
        id: "123",
        displayName: "123"
    },
    src: `https://demo.website.com/files/12345678/filenameA.png`,
    key: `12345678/filenameA.png`,
    name: "filenameA.png",
    size: 123456,
    type: "image/png",
    tags: ["sketch", "file-a", "webiny"],
    aliases: []
};

describe("GraphQLInputMapper", () => {
    it("should return a GraphQL formatted output based on the received BatchDTO and previous data", () => {
        const data: FileItem = {
            ...fileMock,
            extensions: {
                field1: "old-field1",
                field2: "old-field2",
                field3: ["old-field3"]
            }
        };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "accessControl",
                    operator: OperatorType.OVERRIDE,
                    value: {
                        accessControl: {
                            type: "private"
                        }
                    }
                },
                {
                    field: "extensions.field1",
                    operator: OperatorType.OVERRIDE,
                    value: {
                        extensions: {
                            field1: "new-field1"
                        }
                    }
                },
                {
                    field: "extensions.field2",
                    operator: OperatorType.REMOVE
                },
                {
                    field: "extensions.field3",
                    operator: OperatorType.APPEND,
                    value: {
                        extensions: {
                            field3: ["new-field3-1", "new-field3-2"]
                        }
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.applyOperations(data, batch);

        expect(output).toEqual({
            ...data,
            accessControl: {
                type: "private"
            },
            extensions: {
                field1: "new-field1",
                field2: null,
                field3: ["old-field3", "new-field3-1", "new-field3-2"]
            }
        });
    });

    it("should not override data for fields not defined in the batch", () => {
        const data: FileItem = {
            ...fileMock,
            accessControl: {
                type: "public"
            },
            extensions: {
                field1: "old-field1",
                field2: "old-field2"
            }
        };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "extensions.field1",
                    operator: OperatorType.OVERRIDE,
                    value: {
                        extensions: {
                            field1: "new-field1"
                        }
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.applyOperations(data, batch);

        expect(output).toEqual({
            ...data,
            extensions: {
                field1: "new-field1",
                field2: "old-field2"
            }
        });
    });
});
