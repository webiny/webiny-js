import { describe, it, vi, expect } from "vitest";

import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest
} from "~tests/utils";
import { insertTestFolders } from "../insertTestFolders";
import { createLocalesData, createTenantsData } from "../common";

import { StepFunctionService } from "@webiny/tasks/service/StepFunctionServicePlugin";

vi.mock("@webiny/tasks/service/StepFunctionServicePlugin", () => {
    const sendMock = vi.fn().mockResolvedValue({
        tenant: "mockTenant",
        locale: "mockLocale",
        id: "mockId",
        definitionId: "mockDefId",
        name: "mockTask",
        input: { type: "*" }
    });

    const StepFunctionService = vi.fn().mockImplementation(() => ({
        send: sendMock
    }));

    // Explicitly mock the prototype's send method
    StepFunctionService.prototype.send = sendMock;

    return {
        StepFunctionService,
        __esModule: true,
        sendMock // Export the mock for testing
    };
});

describe("5.43.0-001 - DDB", { timeout: 900_000 }, () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if no tenant found", async () => {
        const handler = createDdbMigrationHandler({ table, migrations: [] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no locale found", async () => {
        await insertTestData(table, [...createTenantsData()]);

        const handler = createDdbMigrationHandler({ table, migrations: [] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no folders found", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);

        const handler = createDdbMigrationHandler({ table, migrations: [] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);
        await insertTestFolders(table, "cms:article");

        const handler = createDdbMigrationHandler({
            table,
            migrations: []
        });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        expect(StepFunctionService.prototype.send).toHaveBeenCalledTimes(5);
        expect(StepFunctionService.prototype.send).toHaveBeenCalledWith(
            {
                definitionId: "acoSyncFlp",
                id: expect.any(String)
            },
            0
        );
    });
});
