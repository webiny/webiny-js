import { Table } from "@webiny/db-dynamodb/toolbox";
import { createdBy, createLocalesData, createTenantsData } from "./006.data";
import { createId, insertDynamoDbTestData } from "~tests/utils";
import { OriginalPageRecord } from "./types";

/**
 * Reduced number of records because it is not necessary anymore to run tests with large amount of records.
 */
export const insertTestPages = async (table: Table<string, string, string>, numberOfPages = 15) => {
    const ddbPages: OriginalPageRecord[] = [];

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
        }
    }
    await insertDynamoDbTestData(table, ddbPages);
    return ddbPages;
};
