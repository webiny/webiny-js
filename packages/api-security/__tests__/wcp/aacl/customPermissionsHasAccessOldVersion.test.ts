import useTestHandler from "./useTestHandler";
import { customPermissions } from "./mocks/customPermissions";

describe(`Custom permissions test (no WCP access but we're dealing with an old project)`, () => {
    test("should be able to use custom permissions if dealing with an old version of Webiny, even if the project wasn't connected with WCP", async () => {
        const { invoke, documentClient } = useTestHandler();

        // Let's remove the `createdOn` value from the System record.
        await documentClient
            .put({
                TableName: process.env.DB_TABLE as string,
                Item: {
                    PK: "T#root#SYSTEM",
                    SK: "SECURITY",
                    createdOn: null
                }
            })
            .promise();

        // This is now an old project and AACL should work as usual.
        const context = await invoke();
        expect(await context.security.getPermissions()).toEqual([
            ...customPermissions,

            // `aacl: null` means we're dealing with an old, non-WCP, Webiny project.
            { name: "wcp", aacl: null }
        ]);
    });
});
