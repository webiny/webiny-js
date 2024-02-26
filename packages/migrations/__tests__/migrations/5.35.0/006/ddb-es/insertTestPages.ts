import { createdBy, createLocalesData, createTenantsData } from "./006.data";
import { createId, insertDynamoDbTestData } from "~tests/utils";
import { insertElasticsearchTestData } from "~tests/utils/insertElasticsearchTestData";
import { Page } from "~/migrations/5.35.0/006/types";
import { esGetIndexName } from "~/utils";
import { Table } from "@webiny/db-dynamodb/toolbox";
import {
    OriginalDynamoDbPageRecord,
    OriginalDynamoElasticsearchDbPageRecord,
    OriginalElasticsearchPageRecord
} from "./types";
import { ElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";

/**
 * Reduced number of records because it is not necessary anymore to run tests with large amount of records.
 */
const NUMBER_OF_PAGES = 15;
const INDEX_TYPE = "page-builder";

interface InsertTestPagesParams {
    numberOfPages?: number;
    elasticsearchClient: ElasticsearchClient;
    ddbTable: Table<string, string, string>;
    esTable: Table<string, string, string>;
}

export const insertTestPages = async (params: InsertTestPagesParams) => {
    const { numberOfPages = NUMBER_OF_PAGES, ddbTable, esTable, elasticsearchClient } = params;

    const ddbPages: OriginalDynamoDbPageRecord[] = [];
    const ddbEsPages: OriginalDynamoElasticsearchDbPageRecord[] = [];
    const esPages: OriginalElasticsearchPageRecord[] = [];

    const tenants = createTenantsData().map(tenant => tenant.data.id);
    const testLocales = createLocalesData();

    for (const tenant of tenants) {
        const locales = testLocales
            .filter(item => item.PK === `T#${tenant}#I18N#L`)
            .map(locale => locale.code) as string[];

        for (const locale of locales) {
            for (let index = 0; index < numberOfPages; index++) {
                const pid = createId();

                const page: Page = {
                    category: "static",
                    createdBy,
                    createdOn: new Date().toISOString(),
                    editor: "page-builder",
                    id: `${pid}#0001`,
                    locale,
                    tenant,
                    locked: true,
                    ownedBy: createdBy,
                    path: `/untitled-${pid}`,
                    pid,
                    publishedOn: new Date().toISOString(),
                    savedOn: new Date().toISOString(),
                    status: "published",
                    title: `Page ${pid}`,
                    version: 1,
                    webinyVersion: "0.0.0",
                    content: null,
                    createdFrom: null,
                    settings: {}
                };

                ddbPages.push({
                    ...page,
                    titleLC: page.title.toLowerCase(),
                    PK: `T#${tenant}#L#${locale}#PB#P#${pid}`,
                    SK: "L",
                    TYPE: "pb.page.l",
                    _ct: new Date().toISOString(),
                    _et: "PbPages",
                    _md: new Date().toISOString(),
                    content: {
                        compression: "jsonpack",
                        content: `id|e2BqxFH8H4|type|document|data|settings|elements|91eudXC1XO|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|Bol7kLmyfW|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|DOZwsXszAT|cell|size|asWyIzGneq|heading|text|typography|heading1|alignment|tag|h1|{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Heading+${pid}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}|path|csorhPDr6y|paragraph|paragraph1|p|{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lorem+ipsum+dolor+sit+amet.+","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|1J]|N|$A|Q]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]`
                    },
                    settings: {
                        general: {
                            image: null,
                            layout: "static",
                            snippet: null,
                            tags: [`tag-${pid}-1`, `tag-${pid}-2`]
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
                    }
                });

                ddbEsPages.push({
                    PK: `T#${tenant}#L#${locale}#PB#P#${pid}`,
                    SK: "L",
                    index: `${tenant.toLowerCase()}-${locale.toLowerCase()}-page-builder`,
                    _ct: "2023-04-05T09:37:05.038Z",
                    _et: "PbPagesEs",
                    _md: "2023-04-05T09:37:05.038Z",
                    data: {
                        __type: "page",
                        latest: true,
                        titleLC: page.title.toLowerCase(),
                        tags: [],
                        snippet: null,
                        images: null,
                        ...page
                    }
                });

                esPages.push({
                    __type: "page",
                    latest: true,
                    titleLC: page.title.toLowerCase(),
                    tags: [],
                    snippet: null,
                    images: null,
                    ...page
                });
            }
        }
    }
    // Inserting useful data: latest page record
    await insertDynamoDbTestData(ddbTable, ddbPages);
    await insertDynamoDbTestData(esTable, ddbEsPages);
    await insertElasticsearchTestData<Page>(elasticsearchClient, esPages, item => {
        return esGetIndexName({
            tenant: item.tenant,
            locale: item.locale,
            type: INDEX_TYPE
        });
    });

    await elasticsearchClient.indices.refreshAll();

    return {
        ddbPages,
        ddbEsPages,
        esPages
    };
};
