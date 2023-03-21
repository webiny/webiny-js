import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    insertTestData,
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

        expect(data.executed.length).toBe(0);
        expect(data.skipped.length).toBe(1);
        expect(data.notApplicable.length).toBe(0);
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

        expect(data.executed.length).toBe(1);
        expect(data.skipped.length).toBe(0);
        expect(data.notApplicable.length).toBe(0);

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
