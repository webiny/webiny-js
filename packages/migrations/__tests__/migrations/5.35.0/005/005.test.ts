import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable, groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { CmsModels_5_35_0_005 } from "~/migrations/5.35.0/005";
import { createTenantsData, createLocalesData, createModelsData } from "./005.data";
import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";
import pluralize from "pluralize";

jest.retryTimes(0);

describe("5.35.0-005", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if there are no models", async () => {
        const handler = createDdbMigrationHandler({ table, migrations: [CmsModels_5_35_0_005] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, [
            ...createTenantsData(),
            ...createLocalesData(),
            ...createModelsData()
        ]);

        const handler = createDdbMigrationHandler({ table, migrations: [CmsModels_5_35_0_005] });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const models = await scanTable(table, {
            filters: [
                {
                    attr: "TYPE",
                    eq: "cms.model"
                }
            ]
        });

        expect(models.length).toBe(9);

        for (const model of models) {
            expect(model.singularApiName).toEqual(upperFirst(camelCase(model.modelId)));
            expect(model.pluralApiName).toEqual(pluralize(upperFirst(camelCase(model.modelId))));
        }
    });
});
