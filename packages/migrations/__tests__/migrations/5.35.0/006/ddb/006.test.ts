import {
    assertNotError,
    createDdbMigrationHandler,
    createId,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";

import { AcoRecords_5_35_0_006 } from "~/migrations/5.35.0/006/ddb";

import { createTenantsData, createLocalesData, createdBy } from "./006.data";
import { ACO_SEARCH_MODEL_ID, PB_PAGE_TYPE, ROOT_FOLDER } from "~/migrations/5.35.0/006/constants";

jest.retryTimes(0);
jest.setTimeout(900000);

const NUMBER_OF_PAGES = 100;
let numberOfGeneratedPages = 0;

describe("5.35.0-006", () => {
    const table = getPrimaryDynamoDbTable();

    const ddbPages: Record<string, any>[] = [];

    logTestNameBeforeEachTest();

    const insertTestPages = async (numberOfPages = NUMBER_OF_PAGES) => {
        ddbPages.length = 0;

        const tenants = createTenantsData().map(tenant => tenant.data.id);
        const testLocales = createLocalesData();

        for (const tenant of tenants) {
            const locales = testLocales
                .filter(item => item.PK === `T#${tenant}#I18N#L`)
                .map(locale => locale.code) as string[];

            for (const locale of locales) {
                for (let index = 0; index < numberOfPages; index++) {
                    const pid = createId();

                    ddbPages.push({
                        PK: `T#${tenant}#L#${locale}#PB#L`,
                        SK: pid,
                        TYPE: "pb.page.l",
                        category: "static",
                        content: {
                            compression: "jsonpack",
                            content: `id|e2BqxFH8H4|type|document|data|settings|elements|91eudXC1XO|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|Bol7kLmyfW|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|DOZwsXszAT|cell|size|asWyIzGneq|heading|text|typography|heading1|alignment|tag|h1|{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Heading+${pid}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}|path|csorhPDr6y|paragraph|paragraph1|p|{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lorem+ipsum+dolor+sit+amet.+","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|1J]|N|$A|Q]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]`
                        },
                        createdBy,
                        createdOn: new Date().toISOString(),
                        editor: "page-builder",
                        id: `${pid}#0001`,
                        locale,
                        locked: true,
                        ownedBy: createdBy,
                        path: `/path-to-${pid}`,
                        pid,
                        publishedOn: new Date().toISOString(),
                        savedOn: new Date().toISOString(),
                        settings: {
                            general: {
                                image: null,
                                layout: "static",
                                snippet: null,
                                tags: [`tag-${pid}`]
                            },
                            seo: {
                                description: null,
                                meta: [],
                                title: null
                            },
                            social: {
                                description: null,
                                image: null,
                                meta: [],
                                title: null
                            }
                        },
                        status: "published",
                        tenant,
                        title: `Page ${pid}`,
                        titleLC: `page ${pid}`,
                        version: 1,
                        webinyVersion: "0.0.0",
                        _ct: new Date().toISOString(),
                        _et: "PbPages",
                        _md: new Date().toISOString()
                    });
                }

                // Inserting useful data: latest page record
                await insertDynamoDbTestData(table, ddbPages);

                // Track generated files
                numberOfGeneratedPages += numberOfPages;
            }
        }
    };

    it("should not run if no tenant found", async () => {
        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no locale found", async () => {
        await insertTestData(table, [...createTenantsData()]);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no pages found", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);
        await insertTestPages();

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const searchRecords = await scanTable(table, {
            filters: [
                {
                    attr: "modelId",
                    eq: "acoSearchRecord"
                }
            ]
        });

        expect(searchRecords.length).toBe(numberOfGeneratedPages * 2);

        for (const page of ddbPages) {
            const {
                createdBy,
                createdOn,
                id,
                locale,
                locked,
                path,
                pid,
                savedOn,
                status,
                tenant,
                title,
                version
            } = page;

            const latestSearchRecord = searchRecords.find(
                record => record.id === `${pid}#0001` && record.SK === "L"
            );
            const revisionSearchRecord = searchRecords.find(
                record => record.id === `${pid}#0001` && record.SK === "REV#0001"
            );

            const values = {
                "text@title": title,
                "text@content": `${title} Heading ${pid} Lorem ipsum dolor sit amet.`,
                "text@type": PB_PAGE_TYPE,
                "object@location": {
                    "text@folderId": ROOT_FOLDER
                },
                "text@tags": [`tag-${pid}`],
                "wby-aco-json@data": {
                    createdBy,
                    createdOn,
                    id,
                    locked,
                    path,
                    pid,
                    savedOn,
                    status,
                    title,
                    version
                }
            };

            // Checking latest ACO search record
            expect(latestSearchRecord).toMatchObject({
                PK: `T#${tenant}#L#${locale}#CMS#CME#CME#${pid}`,
                SK: "L",
                entryId: pid,
                GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#L`,
                GSI1_SK: `${pid}#0001`,
                id: `${pid}#0001`,
                locale,
                locked: false,
                modelId: ACO_SEARCH_MODEL_ID,
                status: "draft",
                tenant,
                TYPE: "cms.entry.l",
                values
            });

            // Checking revision 1 ACO search record
            expect(revisionSearchRecord).toMatchObject({
                PK: `T#${tenant}#L#${locale}#CMS#CME#CME#${pid}`,
                SK: "REV#0001",
                entryId: pid,
                GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#A`,
                GSI1_SK: `${pid}#0001`,
                id: `${pid}#0001`,
                locale,
                locked: false,
                modelId: ACO_SEARCH_MODEL_ID,
                status: "draft",
                tenant,
                TYPE: "cms.entry",
                values
            });
        }
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);
        await insertTestPages(1);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });

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
