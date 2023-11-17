import { Table } from "@webiny/db-dynamodb/toolbox";
import { CmsEntry, Identity } from "~/migrations/5.37.0/002/types";
import { insertDynamoDbTestData } from "~tests/utils";

type DbItem<T> = T & {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
    TYPE: string;
    _et: string;
    _md: string;
    _ct: string;
};

const identity: Identity = {
    id: "root",
    displayName: "Root",
    type: "admin"
};

const tenants = [
    "root",
    "not-root",
    "webiny",
    "admin",
    "not-admin",
    "webiny-admin",
    "webiny-not-admin"
];
const locales = [
    "en-US",
    "de-DE",
    "fr-FR",
    "be-BE",
    "nl-NL",
    "hr-HR",
    "it-IT",
    "es-ES",
    "pt-PT",
    "pt-BR"
];
/**
 * Items generated per tenant / locale combination.
 * This is used in the test which actually updates everything.
 */
const defaultMaxItems = 25;
/**
 * !!! IMPORTANT !!!
 * UPDATE IF YOU CHANGE THE NUMBER OF RECORDS PER ENTRY.
 * Which records are pushed into the DynamoDB?
 * - L
 * - P
 * - REV#0001
 * - REV#0002
 */
const itemPushes = 4;

export const getTotalItems = () => {
    return tenants.length * locales.length * defaultMaxItems * itemPushes;
};

interface Options {
    maxItems?: number;
}

export const insertTestEntries = async (
    table: Table<string, string, string>,
    options?: Options
) => {
    const maxItems = options?.maxItems || defaultMaxItems;
    for (const tenant of tenants) {
        const items = [];
        for (const locale of locales) {
            for (let i = 1; i <= maxItems; i++) {
                const entryId = `${tenant}-${locale}-${i}`;

                const item: DbItem<CmsEntry> = {
                    PK: `T#${tenant}#L#${locale}#CMS#CME#CME#${entryId}`,
                    SK: "REV#0001",
                    GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#randomModelId#L`,
                    GSI1_SK: `${entryId}#0001`,
                    _et: "CmsEntries",
                    _md: new Date().toISOString(),
                    _ct: new Date().toISOString(),
                    tenant,
                    locale,
                    id: `${entryId}#0001`,
                    entryId,
                    modelId: "randomModelId",
                    TYPE: "cms.entry",
                    locked: true,
                    status: "published",
                    ownedBy: identity,
                    createdBy: identity,
                    createdOn: new Date().toISOString(),
                    savedOn: new Date().toISOString(),
                    publishedOn: new Date().toISOString(),
                    values: {
                        title: `Entry ${entryId}`
                    },
                    webinyVersion: "5.36.2",
                    version: 1
                };
                // REV 1
                items.push(item);
                // REV 2
                items.push({
                    ...item,
                    id: `${entryId}#0002`,
                    SK: "REV#0002"
                });
                // latest
                items.push({
                    ...item,
                    TYPE: "cms.entry.l",
                    id: `${entryId}#0002`,
                    SK: "L",
                    GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#randomModelId#A`
                });
                // published
                items.push({
                    ...item,
                    TYPE: "cms.entry.p",
                    id: `${entryId}#0002`,
                    SK: "P",
                    GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#randomModelId#P`
                });
            }
        }
        await insertDynamoDbTestData(table, items);
    }
};
