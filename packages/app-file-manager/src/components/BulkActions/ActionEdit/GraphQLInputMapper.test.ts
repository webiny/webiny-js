import { GraphQLInputMapper } from "./GraphQLInputMapper";
import { BatchDTO, OperatorType } from "~/components/BulkActions/ActionEdit/domain";
import { FileItem } from "@webiny/app-admin/types";

const fileMock: FileItem = {
    id: "12345678",
    location: {
        folderId: "root"
    },
    createdOn: new Date().toISOString(),
    createdBy: {
        id: "123",
        displayName: "123"
    },
    savedOn: new Date().toISOString(),
    savedBy: {
        id: "123",
        displayName: "123"
    },
    modifiedOn: new Date().toISOString(),
    modifiedBy: {
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

    it("should not OVERRIDE data in case of nullish value", () => {
        const data: FileItem = {
            ...fileMock,
            extensions: {
                field1: "old-field-1"
            }
        };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "extensions.field1",
                    operator: OperatorType.OVERRIDE,
                    value: {
                        extensions: {
                            field1: null
                        }
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.applyOperations(data, batch);

        expect(output).toEqual({
            ...data,
            extensions: {
                field1: "old-field-1"
            }
        });
    });

    it("should not APPEND data in case of nullish value", () => {
        const data: FileItem = {
            ...fileMock,
            extensions: {
                field1: "old-field-1"
            }
        };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "extensions.field1",
                    operator: OperatorType.APPEND,
                    value: {
                        extensions: {
                            field1: null
                        }
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.applyOperations(data, batch);

        expect(output).toEqual({
            ...data,
            extensions: {
                field1: "old-field-1"
            }
        });
    });

    it("should not APPEND data in case of non-array value", () => {
        const data: FileItem = {
            ...fileMock,
            extensions: {
                field1: "old-field-1"
            }
        };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "extensions.field1",
                    operator: OperatorType.APPEND,
                    value: {
                        extensions: {
                            field1: "any-string"
                        }
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.applyOperations(data, batch);

        expect(output).toEqual({
            ...data,
            extensions: {
                field1: "old-field-1"
            }
        });
    });

    it("should APPEND new data to non existing envelope", () => {
        const data: FileItem = { ...fileMock };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "extensions.field1",
                    operator: OperatorType.APPEND,
                    value: {
                        extensions: {
                            field1: ["new-field1-1", "new-field1-2"]
                        }
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.applyOperations(data, batch);

        expect(output).toEqual({
            ...data,
            extensions: {
                field1: ["new-field1-1", "new-field1-2"]
            }
        });
    });

    it("should APPEND new data for fields with nullish value", () => {
        const data: FileItem = {
            ...fileMock,
            extensions: {
                field1: null
            }
        };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "extensions.field1",
                    operator: OperatorType.APPEND,
                    value: {
                        extensions: {
                            field1: ["new-field1-1", "new-field1-2"]
                        }
                    }
                }
            ]
        };

        const output = GraphQLInputMapper.applyOperations(data, batch);

        expect(output).toEqual({
            ...data,
            extensions: {
                field1: ["new-field1-1", "new-field1-2"]
            }
        });
    });

    it("should return existing data in case of invalid operation", () => {
        const data: FileItem = {
            ...fileMock,
            extensions: {
                field1: "old-field1"
            }
        };

        const batch: BatchDTO = {
            operations: [
                {
                    field: "field1",
                    operator: "ANY-OPERATION",
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
                field1: "old-field1"
            }
        });
    });
});
