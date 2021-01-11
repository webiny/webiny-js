import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Db } from "@webiny/db";

jest.setTimeout(120000);

describe("connection timeouts test", () => {
    test("should stop connecting after 5 second", async () => {
        // We just want to verify that if the connection params are invalid, the connection establishing
        // eventually does end, and doesn't end up keeping a Lambda function alive until its timeout.

        const db = new Db({
            table: "PageBuilder",
            driver: new DynamoDbDriver({
                documentClient: new DocumentClient({
                    convertEmptyValues: true,
                    endpoint: "invalid-table",
                    sslEnabled: false,
                    region: "local"
                })
            })
        });

        let error;
        try {
            await db.create({ table: "invalid-table", data: { PK: "pk", SK: "sk" } });
        } catch (e) {
            error = e;
        }

        // Error must've been thrown. Different errors get thrown in local and CI, that's why
        // we're just testing if an error was thrown.
        const message = error.message;
        expect(message.startsWith("getaddrinfo") || message.startsWith("Inaccessible host:")).toBe(
            true
        );
    });
});
