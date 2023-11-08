import { PutCommand } from "@webiny/aws-sdk/client-dynamodb";
import { createMockContextHandler } from "./mockContextHandler";
import { customPermissions } from "./mocks/customPermissions";

describe(`Custom permissions test (no WCP access but we're dealing with an old project)`, () => {
    test("should be able to use custom permissions if dealing with an old version of Webiny, even if the project wasn't connected with WCP", async () => {
        const { handle, documentClient } = createMockContextHandler();

        // Let's remove the `installedOn` value from the System record.
        await documentClient.send(
            new PutCommand({
                TableName: process.env.DB_TABLE as string,
                Item: {
                    PK: "T#root#SYSTEM",
                    SK: "SECURITY",
                    installedOn: null
                }
            })
        );

        // This is now an old project and AACL should work as usual.
        const context = await handle();
        expect(await context.security.listPermissions()).toEqual([
            ...customPermissions,

            // `legacy: true` means we're dealing with an old, non-WCP, Webiny project.
            { name: "aacl", legacy: true, teams: false }
        ]);
    });
});
