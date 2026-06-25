import { describe, it, expect } from "vitest";
import DynamoDbDriver from "~/DynamoDbDriver";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/DynamoDbDocumentClient";
import { DynamoDbBatchFactoryImpl } from "~/features/DynamoDbBatchFactory/DynamoDbBatchFactory";
import { DynamoDbEntityFactoryImpl } from "~/features/DynamoDbEntityFactory/DynamoDbEntityFactory";

const createDriver = () => {
    const documentClient = getDocumentClient();
    const client = new DynamoDbDocumentClient({
        documentClient,
        tableName: process.env.DB_TABLE as string
    });
    const batchFactory = new DynamoDbBatchFactoryImpl();
    const entityFactory = new DynamoDbEntityFactoryImpl(batchFactory);

    return {
        driver: new DynamoDbDriver({ documentClient, client, entityFactory }),
        documentClient
    };
};

describe("DynamoDbDriver", () => {
    it("should properly construct DynamoDbDriver", () => {
        const { driver, documentClient } = createDriver();

        expect(driver.getClient()).toBe(documentClient);
    });

    it("should properly store an item", async () => {
        const { driver } = createDriver();

        const key = "test";
        const value = {
            test: "test",
            andEvenSomeComplexData: {
                str: "string",
                orMoreComplex: {
                    boolean: true,
                    moreData: 1234
                }
            }
        };
        const result = await driver.storeValue(key, value);

        expect(result.error).toBeUndefined();
        expect(result.key).toEqual(key);
        expect(result.data).toEqual(value);
    });

    it("should properly store an item and retrieve it", async () => {
        const { driver } = createDriver();

        const key = "test";
        const value = {
            test: "test",
            andEvenSomeComplexData: {
                str: "string",
                orMoreComplex: {
                    boolean: true,
                    moreData: 1234
                }
            }
        };
        await driver.storeValue(key, value);

        const result = await driver.getValue(key);

        expect(result.error).toBeUndefined();
        expect(result.key).toEqual(key);
        expect(result.data).toEqual(value);

        const results = await driver.getValues([key]);
        expect(results.error).toBeUndefined();
        expect(results.keys).toEqual([key]);
        // @ts-expect-error
        expect(results.data[key]).toEqual(value);

        const listed = await driver.listValues();
        expect(listed.error).toBeUndefined();
        // @ts-expect-error
        expect(listed.keys).toEqual([key]);
        // @ts-expect-error
        expect(listed.data[key]).toEqual(value);
    });

    it("should properly store a list of items and retrieve them", async () => {
        const { driver } = createDriver();

        const items = {
            testing1: {
                test: "test",
                andEvenSomeComplexData: {
                    str: "string",
                    orMoreComplex: {
                        boolean: true,
                        moreData: 1234
                    }
                }
            },
            testing2: {
                test: "test",
                andEvenSomeComplexData: {
                    str: "string",
                    orMoreComplex: {
                        boolean: true,
                        moreData: 1234
                    }
                }
            },
            testing3: {
                test: "test",
                andEvenSomeComplexData: {
                    str: "string",
                    orMoreComplex: {
                        boolean: true,
                        moreData: 1234
                    }
                }
            }
        };

        await driver.storeValues(items);

        const results = await driver.getValues(Object.keys(items));
        expect(results.error).toBeUndefined();
        expect(results.keys).toEqual(Object.keys(items));

        expect(results.data).toEqual(items);
    });

    it("should properly remove an item", async () => {
        const { driver } = createDriver();

        const key = "test";
        const value = {
            test: "test",
            andEvenSomeComplexData: {
                str: "string",
                orMoreComplex: {
                    boolean: true,
                    moreData: 1234
                }
            }
        };
        await driver.storeValue(key, value);

        const stored = await driver.getValue(key);
        expect(stored.error).toBeUndefined();
        expect(stored.key).toEqual(key);
        expect(stored.data).toEqual(value);

        const result = await driver.removeValue(key);
        expect(result.error).toBeUndefined();
        expect(result.key).toEqual(key);
        expect(result.data).toEqual(value);

        const results = await driver.getValues([key]);
        expect(results.error).toBeUndefined();
        expect(results.keys).toEqual([key]);
        // @ts-expect-error
        expect(results.data[key]).toBeNull();
    });

    it("should remove a list of items", async () => {
        const { driver } = createDriver();

        const items = {
            testing1: {
                test: "test",
                andEvenSomeComplexData: {
                    str: "string",
                    orMoreComplex: {
                        boolean: true,
                        moreData: 1234
                    }
                }
            },
            testing2: {
                test: "test",
                andEvenSomeComplexData: {
                    str: "string",
                    orMoreComplex: {
                        boolean: true,
                        moreData: 1234
                    }
                }
            },
            testing3: {
                test: "test",
                andEvenSomeComplexData: {
                    str: "string",
                    orMoreComplex: {
                        boolean: true,
                        moreData: 1234
                    }
                }
            }
        };

        await driver.storeValues(items);

        const results = await driver.getValues(Object.keys(items));
        expect(results.error).toBeUndefined();
        expect(results.keys).toEqual(Object.keys(items));
        expect(results.data).toEqual(items);

        const storedList = await driver.listValues();
        expect(storedList.error).toBeUndefined();
        expect(storedList.data).toEqual(items);

        const keys = Object.keys(items);
        const removed = await driver.removeValues(keys);
        expect(removed.error).toBeUndefined();
        expect(removed.keys).toEqual(keys);

        const listed = await driver.listValues();
        expect(listed.error).toBeUndefined();
        expect(listed.data).toEqual({});
    });
});
