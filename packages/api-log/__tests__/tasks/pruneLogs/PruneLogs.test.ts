import { describe, it, expect, beforeEach } from "vitest";
import { PruneLogs } from "~/tasks/pruneLogs/PruneLogs";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { DynamoDbLoggerKeys, DynamoDbStorageOperations } from "~/logger";
import { Response, TaskResponse } from "@webiny/tasks";
import type {
    ILogger,
    ILoggerCrudListLogsCallable,
    ILoggerStorageOperations,
    ILoggerStorageOperationsListLogsCallable
} from "~/types";
import { LogType } from "~/types";
import type { Entity } from "@webiny/db-dynamodb/toolbox";
import { create } from "~/db";
import { createMockLogger } from "~tests/mocks/logger";
import type { GetValueResult, IStore, RemoveValueResult, StorageKey } from "@webiny/db";
import { getIdentity } from "~tests/mocks/getIdentity";

describe("PruneLogs", () => {
    let prune: PruneLogs;
    const documentClient = getDocumentClient();
    let response: TaskResponse;

    let entity: Entity;
    let storageOperations: ILoggerStorageOperations;

    let logger: ILogger;

    const store: Pick<IStore, "getValue" | "removeValue"> = {
        async getValue(key: StorageKey): Promise<GetValueResult<any>> {
            return {
                key,
                data: {
                    identity: getIdentity(),
                    taskId: "1234"
                }
            };
        },
        async removeValue(key: StorageKey): Promise<RemoveValueResult<any>> {
            return {
                key,
                data: {
                    identity: getIdentity(),
                    taskId: "1234"
                }
            };
        }
    };

    beforeEach(async () => {
        prune = new PruneLogs({
            documentClient,
            keys: new DynamoDbLoggerKeys()
        });
        response = new TaskResponse(
            new Response({
                endpoint: "manage",
                tenant: "root",
                executionName: "test",
                stateMachineId: "test",
                webinyTaskDefinitionId: "test",
                webinyTaskId: "test"
            })
        );
        const result = create({
            documentClient
        });
        entity = result.entity;
        storageOperations = new DynamoDbStorageOperations({
            keys: new DynamoDbLoggerKeys(),
            entity
        });
        logger = createMockLogger({
            storageOperations
        });
    });

    it("should run prune logs with no logs to actually prune", async () => {
        const list: ILoggerCrudListLogsCallable = async () => {
            return {
                items: [],
                meta: {
                    cursor: null,
                    totalCount: 0,
                    hasMoreItems: false
                }
            };
        };
        const result = await prune.execute({
            store,
            list,
            response,
            input: {},
            isAborted: () => false,
            isCloseToTimeout: () => false
        });

        expect(result).toEqual({
            message: undefined,
            output: {
                items: 0
            },
            status: "done",
            tenant: "root",
            webinyTaskDefinitionId: "test",
            webinyTaskId: "test"
        });
    });

    it("should prune logs in `anotherTenant`", async () => {
        const source = "myCustomSource";
        const rootTenant = "root";
        const anotherTenant = "anotherTenant";
        // create some logs in root and anotherTenant
        logger.debug(source, "debug-message", {
            tenant: rootTenant
        });
        logger.notice(source, "notice-message", {
            tenant: rootTenant
        });
        logger.info(source, "info-message", {
            tenant: rootTenant
        });
        logger.warn(source, "warn-message", {
            tenant: rootTenant
        });

        logger.error(source, "error-message", {
            tenant: rootTenant
        });

        logger.debug(source, "debug-message", {
            tenant: anotherTenant
        });

        await logger.flush();

        const result = await storageOperations.listLogs({});
        const expected = [
            {
                type: LogType.DEBUG,
                createdOn: expect.toBeDateString(),
                source,
                tenant: rootTenant,
                data: "debug-message",
                id: expect.any(String)
            },
            {
                type: LogType.NOTICE,
                createdOn: expect.toBeDateString(),
                source,
                tenant: rootTenant,
                data: "notice-message",
                id: expect.any(String)
            },
            {
                type: LogType.INFO,
                createdOn: expect.toBeDateString(),
                source,
                tenant: rootTenant,
                data: "info-message",
                id: expect.any(String)
            },
            {
                type: LogType.WARN,
                createdOn: expect.toBeDateString(),
                source,
                tenant: rootTenant,
                data: "warn-message",
                id: expect.any(String)
            },
            {
                type: LogType.ERROR,
                createdOn: expect.toBeDateString(),
                source,
                tenant: rootTenant,
                data: "error-message",
                id: expect.any(String)
            },
            {
                type: LogType.DEBUG,
                createdOn: expect.toBeDateString(),
                source,
                tenant: anotherTenant,
                data: "debug-message",
                id: expect.any(String)
            }
        ];
        expect(result.items.length).toBe(expected.length);
        expect(result.items).toEqual(expected);

        const list: ILoggerStorageOperationsListLogsCallable = async params => {
            return storageOperations.listLogs(params);
        };
        /**
         * Should not prune anything because the default date is too far into the past.
         */
        const pruneNothingResult = await prune.execute({
            store,
            list,
            response,
            input: {},
            isAborted: () => false,
            isCloseToTimeout: () => false
        });

        expect(pruneNothingResult).toEqual({
            message: undefined,
            output: {
                items: 0
            },
            status: "done",
            tenant: "root",
            webinyTaskDefinitionId: "test",
            webinyTaskId: "test"
        });

        /**
         * Only prune from anotherTenant.
         */
        const pruneResult = await prune.execute({
            store,
            list,
            response,
            input: {
                createdAfter: new Date().toISOString(),
                tenant: anotherTenant
            },
            isAborted: () => false,
            isCloseToTimeout: () => false
        });
        expect(pruneResult).toEqual({
            message: undefined,
            output: {
                items: 1
            },
            status: "done",
            tenant: "root",
            webinyTaskDefinitionId: "test",
            webinyTaskId: "test"
        });

        const resultAfterPrune = await storageOperations.listLogs({});
        expect(resultAfterPrune.items.length).toBe(expected.length - 1);
        expect(resultAfterPrune.items).toEqual(
            expected.filter(item => item.tenant !== anotherTenant)
        );

        /**
         * After prune of anotherTenant, let's add some more logs to another tenant.
         */

        logger.info(source, "info-message", {
            tenant: anotherTenant
        });
        logger.error(source, "error-message", {
            tenant: anotherTenant
        });
        await logger.flush();

        const resultAfterFlush = await storageOperations.listLogs({});
        expect(resultAfterFlush.items.length).toBe(7);
        /**
         * And then prune everything.
         */
        const pruneAllResult = await prune.execute({
            store,
            list,
            response,
            input: {
                createdAfter: new Date().toISOString()
            },
            isAborted: () => false,
            isCloseToTimeout: () => false
        });
        expect(pruneAllResult).toEqual({
            message: undefined,
            output: {
                items: 7
            },
            status: "done",
            tenant: "root",
            webinyTaskDefinitionId: "test",
            webinyTaskId: "test"
        });

        const resultAfterPruneAll = await storageOperations.listLogs({});
        expect(resultAfterPruneAll.items.length).toBe(0);
    });
});
