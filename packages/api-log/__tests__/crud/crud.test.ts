import { describe, it, expect, beforeEach } from "vitest";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { getTenant } from "~tests/mocks/getTenant";
import { DynamoDbLoggerKeys, DynamoDbStorageOperations } from "~/logger";
import { create } from "~/db";
import type { Context, ILoggerStorageOperations } from "~/types";
import { LogType } from "~/types";
import type { Entity } from "@webiny/db-dynamodb/toolbox";
import { createCrud as baseCreateCrud } from "~/crud";
import { NotFoundError } from "@webiny/handler-graphql";
import { loggerFactory } from "~/logger/factory";

describe("crud", () => {
    const documentClient = getDocumentClient();

    let entity: Entity;
    let storageOperations: ILoggerStorageOperations;

    const checkPermission = async (): Promise<void> => {
        return;
    };

    const createCrud = () => {
        // @ts-expect-error Types changed
        return baseCreateCrud({
            storageOperations,
            checkPermission
        });
    };

    beforeEach(() => {
        const result = create({
            documentClient
        });
        entity = result.entity;
        storageOperations = new DynamoDbStorageOperations({
            keys: new DynamoDbLoggerKeys(),
            entity
        });
    });

    it("should create crud methods", async () => {
        const crud = createCrud();

        expect(crud).toHaveProperty("getLog");
        expect(crud).toHaveProperty("deleteLog");
        expect(crud).toHaveProperty("deleteLogs");
        expect(crud).toHaveProperty("listLogs");
        expect(crud).toHaveProperty("withSource");
    });

    it("should run getLog method", async () => {
        const crud = createCrud();

        try {
            const result = await crud.getLog({
                where: {
                    id: "1"
                }
            });
            expect(result).toEqual("Should not happen.");
        } catch (ex) {
            expect(ex).toBeInstanceOf(NotFoundError);
        }
    });

    it("should run deleteLog method", async () => {
        const crud = createCrud();

        try {
            const result = await crud.deleteLog({
                where: {
                    id: "1"
                }
            });
            expect(result).toEqual("Should not happen.");
        } catch (ex) {
            expect(ex).toBeInstanceOf(NotFoundError);
        }
    });

    it("should run deleteLogs method", async () => {
        const crud = createCrud();

        const result = await crud.deleteLogs({
            where: {
                items: ["1"]
            }
        });
        expect(result).toEqual([]);
    });

    it("should run listLogs method", async () => {
        const crud = createCrud();

        const result = await crud.listLogs({});
        expect(result).toEqual({
            items: [],
            meta: {
                totalCount: -1,
                cursor: null,
                hasMoreItems: false
            }
        });
    });

    it("should run withSource method", async () => {
        const crud = createCrud();

        const result = crud.withSource("source");
        expect(result).toHaveProperty("info");
        expect(result).toHaveProperty("notice");
        expect(result).toHaveProperty("debug");
        expect(result).toHaveProperty("warn");
        expect(result).toHaveProperty("error");
        expect(result).toHaveProperty("flush");
    });

    it("should log via withSource method", async () => {
        const { logger: masterLogger } = loggerFactory({
            documentClient,
            getTenant
        });

        const context: Context["logger"] = {
            log: masterLogger,
            ...createCrud()
        };

        const logger = context.withSource("source");
        logger.info({ message: "test" });
        logger.notice({ message: "test" });
        logger.debug({ message: "test" });
        logger.warn({ message: "test" });
        logger.error({ message: "test" });

        const result = await logger.flush();
        expect(result).toMatchObject([
            {
                id: expect.any(String),
                type: LogType.INFO
            },
            {
                id: expect.any(String),
                type: LogType.NOTICE
            },
            {
                id: expect.any(String),
                type: LogType.DEBUG
            },
            {
                id: expect.any(String),
                type: LogType.WARN
            },
            {
                id: expect.any(String),
                type: LogType.ERROR
            }
        ]);
    });
});
