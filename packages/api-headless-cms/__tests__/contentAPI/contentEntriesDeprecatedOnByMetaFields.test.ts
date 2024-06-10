import { SecurityIdentity } from "@webiny/api-security/types";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { PutCommand, QueryCommand, unmarshall } from "@webiny/aws-sdk/client-dynamodb";
import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms/plugins";

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };

jest.mock("~/graphql/getSchema/generateCacheId", () => {
    return {
        generateCacheId: () => Date.now()
    };
});

describe("Content entries - Entry Meta Fields", () => {
    const { manage: manageApiIdentityA } = useTestModelHandler({
        identity: identityA
    });

    beforeEach(async () => {
        await manageApiIdentityA.setup();
    });

    test("deprecated 'publishedOn' and 'ownedBy' GraphQL fields should still return values", async () => {
        const { data: testEntry } = await manageApiIdentityA.createTestEntry();

        // Let's directly insert values for deprecated fields.
        const client = getDocumentClient();

        // Query all records where PK = `T#root#L#en-US#CMS#CME#CME#${testEntry.entryId}` and SK > "".
        const { Items: testEntryDdbRecords } = await client.send(
            new QueryCommand({
                TableName: String(process.env.DB_TABLE),
                KeyConditionExpression: "PK = :PK AND SK > :SK",
                ExpressionAttributeValues: {
                    ":PK": { S: `T#root#L#en-US#CMS#CME#CME#${testEntry.entryId}` },
                    ":SK": { S: " " }
                }
            })
        );

        for (const testEntryDdbRecord of testEntryDdbRecords!) {
            await client.send(
                new PutCommand({
                    TableName: process.env.DB_TABLE,
                    Item: {
                        ...unmarshall(testEntryDdbRecord),
                        publishedOn: "2021-01-01T00:00:00.000Z",
                        ownedBy: identityA
                    }
                })
            );
        }

        // Ensure values are visible when data is fetched via GraphQL.
        const { data: testEntryWithDeprecatedFields } = await manageApiIdentityA.getTestEntry({
            revision: testEntry.id
        });

        expect(testEntryWithDeprecatedFields).toMatchObject({
            publishedOn: "2021-01-01T00:00:00.000Z",
            ownedBy: identityA
        });
    });

    test("deprecated 'publishedOn' and 'ownedBy' GraphQL fields should fall back to new fields if no value is present", async () => {
        const { data: testEntry } = await manageApiIdentityA.createTestEntry();

        const { data: publishedTestEntry } = await manageApiIdentityA.publishTestEntry({
            revision: testEntry.id
        });

        expect(publishedTestEntry).toMatchObject({
            publishedOn: null,
            ownedBy: null
        });

        // Ensure values are visible when data is fetched via GraphQL.
        const customGqlResolvers = new CmsGraphQLSchemaPlugin({
            resolvers: {
                TestEntry: {
                    publishedOn: entry => {
                        return entry.lastPublishedOn;
                    },
                    ownedBy: entry => {
                        return entry.createdBy;
                    }
                }
            }
        });

        customGqlResolvers.name = "cms-test-entry-meta-fields";

        const { manage: manageApiWithGqlResolvers, read: readApiWithGqlResolvers } =
            useTestModelHandler({
                identity: identityA,
                plugins: [customGqlResolvers]
            });

        const { data: testEntryWithDeprecatedFields } =
            await manageApiWithGqlResolvers.getTestEntry({
                revision: testEntry.id
            });

        expect(testEntryWithDeprecatedFields).toMatchObject({
            publishedOn: publishedTestEntry.lastPublishedOn,
            ownedBy: publishedTestEntry.createdBy
        });

        const { data: readTestEntryWithDeprecatedFields } =
            await readApiWithGqlResolvers.getTestEntry({
                where: {
                    entryId: testEntry.entryId
                }
            });

        expect(readTestEntryWithDeprecatedFields).toMatchObject({
            publishedOn: publishedTestEntry.lastPublishedOn,
            ownedBy: publishedTestEntry.createdBy
        });
    });
});
