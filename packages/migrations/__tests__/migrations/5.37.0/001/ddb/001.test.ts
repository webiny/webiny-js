import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { TenantLinkRecords_5_37_0_001 } from "~/migrations/5.37.0/001";
import { createTenantLinksData, createTenantsData } from "./001.data";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.37.0-001", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if no tenant found", async () => {
        const handler = createDdbMigrationHandler({
            table,
            migrations: [TenantLinkRecords_5_37_0_001]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no tenant links found", async () => {
        await insertTestData(table, createTenantsData());

        const handler = createDdbMigrationHandler({
            table,
            migrations: [TenantLinkRecords_5_37_0_001]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, [...createTenantsData(), ...createTenantLinksData()]);

        const handler = createDdbMigrationHandler({
            table,
            migrations: [TenantLinkRecords_5_37_0_001]
        });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const ddbItems = await scanTable(table, {
            filters: [
                {
                    attr: "PK",
                    beginsWith: "IDENTITY#"
                }
            ]
        });

        expect(ddbItems).toMatchObject([
            {
                entity: "SecurityIdentity2Tenant",
                PK: "IDENTITY#64942e46a5d103f5dacb7792",
                SK: "LINK#T#root",
                GSI1_PK: "T#root",
                GSI1_SK: "TYPE#permissions#IDENTITY#64942e46a5d103f5dacb7792",

                type: "group",
                data: {
                    group: "649429a0d9bd1f0008416796",
                    permissions: [
                        { name: "content.i18n" },
                        { name: "cms.endpoint.read" },
                        { name: "cms.endpoint.manage" },
                        { name: "cms.endpoint.preview" }
                    ],
                    teams: [],
                    groups: [
                        {
                            id: "649429a0d9bd1f0008416796",
                            permissions: [
                                { name: "content.i18n" },
                                { name: "cms.endpoint.read" },
                                { name: "cms.endpoint.manage" },
                                { name: "cms.endpoint.preview" }
                            ]
                        }
                    ]
                }
            },
            {
                entity: "SecurityIdentity2Tenant",
                PK: "IDENTITY#64942e80610668b2ce7fd29d",
                SK: "LINK#T#otherTenant",
                GSI1_PK: "T#otherTenant",
                GSI1_SK: "TYPE#permissions#IDENTITY#64942e80610668b2ce7fd29d",
                type: "group",
                data: {
                    group: "649429a0d9bd1f0008416796",
                    permissions: [
                        {
                            name: "cms.contentModel",
                            models: {
                                "en-US": ["testAd", "adrianTest2", "adrianTest"]
                            },
                            rwd: "rwd",
                            own: false,
                            pw: null
                        },
                        {
                            name: "cms.contentModelGroup",
                            rwd: "r",
                            own: false,
                            pw: null
                        },
                        {
                            name: "cms.contentEntry",
                            rwd: "rwd",
                            own: false,
                            pw: null
                        }
                    ],
                    teams: [],
                    groups: [
                        {
                            id: "649429a0d9bd1f0008416796",
                            permissions: [
                                {
                                    name: "cms.contentModel",
                                    models: {
                                        "en-US": ["testAd", "adrianTest2", "adrianTest"]
                                    },
                                    rwd: "rwd",
                                    own: false,
                                    pw: null
                                },
                                {
                                    name: "cms.contentModelGroup",
                                    rwd: "r",
                                    own: false,
                                    pw: null
                                },
                                {
                                    name: "cms.contentEntry",
                                    rwd: "rwd",
                                    own: false,
                                    pw: null
                                }
                            ]
                        }
                    ]
                }
            },
            {
                entity: "SecurityIdentity2Tenant",
                PK: "IDENTITY#649429aad9bd1f0008416798",
                SK: "LINK#T#root",
                GSI1_PK: "T#root",
                GSI1_SK: "TYPE#permissions#IDENTITY#649429aad9bd1f0008416798",
                type: "group",
                data: {
                    group: "649429a0d9bd1f0008416796",
                    permissions: [{ name: "*" }],
                    teams: [],
                    groups: [
                        {
                            id: "649429a0d9bd1f0008416796",
                            permissions: [{ name: "*" }]
                        }
                    ]
                }
            }
        ]);
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, [...createTenantsData(), ...createTenantLinksData()]);

        const handler = createDdbMigrationHandler({
            table,
            migrations: [TenantLinkRecords_5_37_0_001]
        });

        // Should run the migration
        {
            process.stdout.write("[First run]\n");
            const { data, error } = await handler();
            assertNotError(error);
            const grouped = groupMigrations(data.migrations);
            expect(grouped.executed.length).toBe(1);
        }

        // Should skip the migration
        {
            process.stdout.write("[Second run]\n");
            const { data, error } = await handler();
            assertNotError(error);
            const grouped = groupMigrations(data.migrations);
            expect(grouped.executed.length).toBe(0);
            expect(grouped.skipped.length).toBe(1);
            expect(grouped.notApplicable.length).toBe(0);
        }
    });
});
