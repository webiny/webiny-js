import { EJSON } from "bson";
import { MongoClient } from "mongodb";
import { createHandler } from "@webiny/handler";
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

    afterAll(async () => {
        await connection.close();
        await db.close();
    });

    test("should insert a record", async () => {
        const event = {
            collection: "Test",
            operation: [
                "insertOne",
                {
                    company: "Webiny",
                    type: "serverless"
                }
            ]
        };

        const { response } = await dbProxy({ body: EJSON.stringify(event) });
        expect(EJSON.parse(response).result.insertedCount).toBe(1);
    });

    test("should find records", async () => {
        const event = {
            collection: "Test",
            operation: ["find", {}, {}]
        };

        let { response } = await dbProxy({ body: EJSON.stringify(event) });
        response = EJSON.parse(response);
        expect(response.result.length).toBe(1);
        expect(response.result[0].company).toBe("Webiny");
    });
});
