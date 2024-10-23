import { OperationsBuilder } from "~/OperationsBuilder";
import { Decompressor } from "~/Decompressor";
import { createPlugins } from "~tests/plugins";
import { DynamoDBRecord } from "@webiny/handler-aws/types";
import { marshall } from "~/marshall";
import { OperationType } from "~/Operations";

describe("OperationsBuilder", () => {
    const decompressor = new Decompressor({
        plugins: createPlugins()
    });

    it("should build an insert operation", async () => {
        const builder = new OperationsBuilder({
            decompressor
        });

        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.INSERT,
                dynamodb: {
                    Keys: marshall({
                        PK: "insertPk",
                        SK: "insertSk"
                    }),
                    NewImage: marshall({
                        index: "a-test-index",
                        data: {
                            id: "123",
                            title: "Test"
                        }
                    })
                }
            }
        ];

        const operations = await builder.build({
            records
        });
        expect(operations.total).toBe(2);

        expect(operations.items).toEqual([
            {
                index: {
                    _id: "insertPk:insertSk",
                    _index: "a-test-index"
                }
            },
            {
                id: "123",
                title: "Test"
            }
        ]);
    });

    it("should build a delete operation", async () => {
        const builder = new OperationsBuilder({
            decompressor
        });

        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.REMOVE,
                dynamodb: {
                    Keys: marshall({
                        PK: "deletePk",
                        SK: "deleteSk"
                    }),
                    OldImage: marshall({
                        index: "a-test-index-for-delete"
                    })
                }
            }
        ];

        const operations = await builder.build({
            records
        });
        expect(operations.total).toBe(1);

        expect(operations.items).toEqual([
            {
                delete: {
                    _id: "deletePk:deleteSk",
                    _index: "a-test-index-for-delete"
                }
            }
        ]);
    });

    it("should skip record if there are no keys", async () => {
        const builder = new OperationsBuilder({
            decompressor
        });

        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.INSERT,
                dynamodb: {
                    NewImage: marshall({
                        index: "a-test-index",
                        data: {
                            id: "123",
                            title: "Test"
                        }
                    })
                }
            }
        ];

        const operations = await builder.build({
            records
        });
        expect(operations.total).toBe(0);

        expect(operations.items).toEqual([]);
    });

    it("should skip record if there is a missing dynamodb property", async () => {
        const builder = new OperationsBuilder({
            decompressor
        });

        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.INSERT
            }
        ];

        const operations = await builder.build({
            records
        });
        expect(operations.total).toBe(0);

        expect(operations.items).toEqual([]);
    });

    it("should skip record if newImage is marked as ignored", async () => {
        const builder = new OperationsBuilder({
            decompressor
        });

        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.INSERT,
                dynamodb: {
                    Keys: marshall({
                        PK: "insertPk",
                        SK: "insertSk"
                    }),
                    NewImage: marshall({
                        ignore: true
                    })
                }
            }
        ];

        const operations = await builder.build({
            records
        });
        expect(operations.total).toBe(0);

        expect(operations.items).toEqual([]);
    });

    it("should skip record if there is nothing in the newImage", async () => {
        const builder = new OperationsBuilder({
            decompressor
        });

        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.INSERT,
                dynamodb: {
                    Keys: marshall({
                        PK: "insertPk",
                        SK: "insertSk"
                    }),
                    NewImage: marshall({})
                }
            },
            {
                eventID: "123",
                eventName: OperationType.INSERT,
                dynamodb: {
                    Keys: marshall({
                        PK: "insertPk",
                        SK: "insertSk"
                    }),
                    // @ts-expect-error
                    NewImage: null
                }
            }
        ];

        const operations = await builder.build({
            records
        });
        expect(operations.total).toBe(0);

        expect(operations.items).toEqual([]);
    });

    it("should skip record if there is no data in the newImage.data", async () => {
        const builder = new OperationsBuilder({
            decompressor
        });

        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.INSERT,
                dynamodb: {
                    Keys: marshall({
                        PK: "insertPk",
                        SK: "insertSk"
                    }),
                    NewImage: marshall({
                        index: "a-test-index"
                    })
                }
            }
        ];

        const operations = await builder.build({
            records
        });
        expect(operations.total).toBe(0);

        expect(operations.items).toEqual([]);
    });

    it("should skip record if there is no index in the oldImage", async () => {
        const builder = new OperationsBuilder({
            decompressor
        });

        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.REMOVE,
                dynamodb: {
                    Keys: marshall({
                        PK: "deletePk",
                        SK: "deleteSk"
                    }),
                    OldImage: marshall({})
                }
            },
            {
                eventID: "1234",
                eventName: OperationType.REMOVE,
                dynamodb: {
                    Keys: marshall({
                        PK: "deletePk",
                        SK: "deleteSk"
                    }),
                    // @ts-expect-error
                    OldImage: null
                }
            },
            {
                eventID: "12345",
                eventName: OperationType.REMOVE,
                dynamodb: {
                    Keys: marshall({
                        PK: "deletePk",
                        SK: "deleteSk"
                    })
                }
            }
        ];

        const operations = await builder.build({
            records
        });
        expect(operations.total).toBe(0);

        expect(operations.items).toEqual([]);
    });
});
