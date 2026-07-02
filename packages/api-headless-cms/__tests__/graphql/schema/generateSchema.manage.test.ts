import { HeadlessCms } from "~/features/shared/abstractions.js";
import { describe, expect, it } from "vitest";
import { generateSchema } from "~/graphql/generateSchema.js";
import { useHandler } from "~tests/testHelpers/useHandler.js";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler.js";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";
import { graphql } from "graphql";
import { introspectionQuery } from "~tests/graphql/schema/__query/introspectionQuery.js";
import allModels from "~tests/contentAPI/mocks/contentModels";

// oxlint-disable-next-line typescript/no-require-imports
const expectedEmptySchemaExecutionResult = require("./__expected/manage/expectedEmptySchemaExecutionResult.json");
// const expectedFruitSchemaExecutionResult = require("./__expected/manage/expectedFruitSchemaExecutionResult.json");

describe("generate graphql manage schema", () => {
    const fruitModelDefinition = allModels.find(m => m.modelId === "fruit")!;

    const manager = useGraphQLHandler({
        path: "manage"
    });

    const contextHandler = useHandler({
        path: "manage"
    });

    it("should generate and execute introspection on basic empty schema", async () => {
        const context = await contextHandler.handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-tenant": "root"
            }
        });

        const schema = await generateSchema({
            context,
            models: []
        });

        const result = await graphql({
            schema,
            source: introspectionQuery.source,
            rootValue: {},
            contextValue: context,
            variableValues: {},
            operationName: introspectionQuery.operationName
        });
        expect(JSON.stringify(result.errors || [])).toEqual("[]");
        expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedEmptySchemaExecutionResult));
    });

    const fields = fruitModelDefinition.fields.map(field => {
        return field.fieldId;
    });

    it.each(fields)("should generate fruit model schema - field %s", async fieldId => {
        const field = fruitModelDefinition.fields.find(field => field.fieldId === fieldId)!;
        expect(field).not.toBeUndefined();
        const model = {
            ...fruitModelDefinition,
            fields: [field],
            layout: [[field.id]]
        };

        await setupGroupAndModels({
            manager,
            models: [model]
        });
        const context = await contextHandler.handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-tenant": "root",
                "x-webiny-cms-endpoint": "manage"
            }
        });

        const models = await context.container.resolve(HeadlessCms).listModels();

        const schema = await generateSchema({
            context,
            models
        });

        const result = await graphql({
            schema,
            source: introspectionQuery.source,
            rootValue: {},
            contextValue: context,
            variableValues: {},
            operationName: introspectionQuery.operationName
        });

        expect(JSON.stringify(result.errors || [])).toEqual("[]");
    });
});
