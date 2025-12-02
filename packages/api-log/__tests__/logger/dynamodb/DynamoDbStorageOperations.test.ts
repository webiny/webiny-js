import { describe, it, expect, beforeEach } from "vitest";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { create } from "~/db";
import { DynamoDbStorageOperations } from "~/logger/dynamodb/DynamoDbStorageOperations";
import { DynamoDbLoggerKeys } from "~/logger";
import { mdbid } from "@webiny/utils";
import { ILoggerLog, LogType } from "~/types";
import { getTenant } from "~tests/mocks/getTenant";

describe("DynamoDbStorageOperations", () => {
    const documentClient = getDocumentClient();

    const tenant = getTenant();

    let entity: Entity;
    let keys: DynamoDbLoggerKeys;
    beforeEach(() => {
        const result = create({
            documentClient
        });
        entity = result.entity;
        keys = new DynamoDbLoggerKeys();
    });

    it("should insert, get, list and delete log", async () => {
        const storageOperations = new DynamoDbStorageOperations({
            entity,
            keys
        });

        const log: ILoggerLog = {
            id: mdbid(),
            createdOn: new Date().toISOString(),
            tenant,
            source: "some-source",
            type: LogType.ERROR,
            data: {
                someData: true,
                withSomeMoreNestedData: true
            }
        };

        const inserted = await storageOperations.insert({
            items: [log]
        });

        expect(inserted).toEqual([log]);
        expect(inserted).toHaveLength(1);

        const getLogResult = await storageOperations.getLog({
            where: {
                id: log.id
            }
        });
        expect(getLogResult).toEqual(inserted[0]);

        const getWrongTenantLogResult = await storageOperations.getLog({
            where: {
                tenant: "unknown-tenant",
                id: log.id
            }
        });
        expect(getWrongTenantLogResult).toBeNull();

        const listLogsResult = await storageOperations.listLogs({});

        expect(listLogsResult).toEqual({
            items: [log],
            meta: {
                hasMoreItems: false,
                totalCount: -1,
                cursor: null
            }
        });

        const deleteWrongTenantLogResult = await storageOperations.deleteLog({
            where: {
                tenant: "unknown-tenant",
                id: log.id
            }
        });
        expect(deleteWrongTenantLogResult).toBeNull();

        const getLogAfterWrongTenantDeleteResult = await storageOperations.getLog({
            where: {
                id: log.id
            }
        });
        expect(getLogAfterWrongTenantDeleteResult).toEqual(inserted[0]);

        const deleteLogResult = await storageOperations.deleteLog({
            where: {
                id: log.id
            }
        });
        expect(deleteLogResult).toEqual(inserted[0]);

        const getLogAfterDeleteResult = await storageOperations.getLog({
            where: {
                id: log.id
            }
        });
        expect(getLogAfterDeleteResult).toBeNull();
        const listLogsAfterDeleteResult = await storageOperations.listLogs({});
        expect(listLogsAfterDeleteResult).toEqual({
            items: [],
            meta: {
                hasMoreItems: false,
                totalCount: -1,
                cursor: null
            }
        });

        await storageOperations.insert({
            items: [
                {
                    ...log,
                    id: mdbid()
                },
                {
                    ...log,
                    id: mdbid()
                },
                {
                    ...log,
                    id: mdbid()
                }
            ]
        });

        const listLogsAfterInsertResult = await storageOperations.listLogs({});
        expect(listLogsAfterInsertResult.items).toHaveLength(3);

        const deleteLogsResult = await storageOperations.deleteLogs({
            where: {
                items: listLogsAfterInsertResult.items.map(item => {
                    return item.id;
                })
            }
        });
        expect(deleteLogsResult.sort((a, b) => a.id.localeCompare(b.id))).toEqual(
            listLogsAfterInsertResult.items.sort((a, b) => a.id.localeCompare(b.id))
        );

        const listLogsAfterDeleteLogsResult = await storageOperations.listLogs({});
        expect(listLogsAfterDeleteLogsResult).toEqual({
            items: [],
            meta: {
                hasMoreItems: false,
                totalCount: -1,
                cursor: null
            }
        });
    });
});
