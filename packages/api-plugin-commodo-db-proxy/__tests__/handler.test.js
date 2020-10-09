import { EJSON } from "bson";
import { MongoClient } from "mongodb";
import { createHandler } from "@webiny/handler-aws";
import databaseProxy from "../src/handler";

describe("Database proxy handler", () => {
    let connection;
    let db;
    let dbProxy;

    beforeAll(async () => {
        connection = await MongoClient.connect(global.__MONGO_URI__, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        db = await connection.db(global.__MONGO_DB_NAME__);

        dbProxy = createHandler(
            databaseProxy({
                database: db,
                server: global.__MONGO_URI__,
                name: global.__MONGO__DB_NAME__
            })
        );
    });

    beforeEach(async () => {
        await db.dropDatabase();
    });

    afterAll(async () => {
        await connection.close();
        await db.close();
    });

    test("should insert a record", async () => {
        const event = {
            operations: [
                {
                    collection: "Test",
                    operation: [
                        "insertOne",
                        {
                            company: "Webiny",
                            type: "serverless"
                        }
                    ]
                }
            ]
        };

        const { response } = await dbProxy({ body: EJSON.stringify(event) });
        expect(EJSON.parse(response).results[0].insertedCount).toBe(1);
    });

    test("should find records", async () => {
        const insertEvent = {
            operations: [
                {
                    collection: "Test",
                    operation: [
                        "insertOne",
                        {
                            company: "Webiny",
                            type: "serverless"
                        }
                    ]
                }
            ]
        };

        await dbProxy({ body: EJSON.stringify(insertEvent) });

        const event = {
            operations: [
                {
                    collection: "Test",
                    operation: ["find", {}, {}]
                }
            ]
        };

        let { response } = await dbProxy({ body: EJSON.stringify(event) });
        response = EJSON.parse(response);
        expect(response.results[0].length).toBe(1);
        expect(response.results[0][0].company).toBe("Webiny");
    });

    test("should execute multiple operations", async () => {
        const event = {
            operations: [
                {
                    collection: "Test",
                    operation: ["insertOne", { name: "Item Z1" }]
                },
                {
                    collection: "Test",
                    operation: ["insertOne", { name: "Item Z2" }]
                }
            ]
        };

        let { response } = await dbProxy({ body: EJSON.stringify(event) });
        response = EJSON.parse(response);
        const [res1, res2] = response.results;
        expect(res1.insertedCount).toBe(1);
        expect(res2.insertedCount).toBe(1);
    });
});
