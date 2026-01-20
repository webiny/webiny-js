import { describe, expect, it } from "vitest";
import { generateSchema } from "~/graphql/generateSchema.js";
import { useHandler } from "~tests/testHelpers/useHandler.js";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler.js";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";
import { expectedEmptySchema } from "./__expected/manage/expectedEmptySchema.js";
import { expectedFruitSchema } from "./__expected/manage/expectedFruitSchema.js";
import { expectedFruitSchemaConfig } from "./__expected/manage/expectedFruitSchemaConfig.js";
import { graphql } from "graphql";
import { introspectionQuery } from "~tests/graphql/schema/__query/introspectionQuery.js";

const expectedEmptySchemaExecutionResult = require("./__expected/manage/expectedEmptySchemaExecutionResult.json");
const expectedFruitSchemaExecutionResult = require("./__expected/manage/expectedFruitSchemaExecutionResult.json");

describe("generate graphql manage schema", () => {
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
        expect(JSON.parse(JSON.stringify(schema))).toMatchObject(expectedEmptySchema);

        const result = await graphql({
            schema,
            source: introspectionQuery.source,
            rootValue: {},
            contextValue: context,
            variableValues: {},
            operationName: introspectionQuery.operationName
        });
        expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedEmptySchemaExecutionResult));
    });

    it("should generate fruit model schema", async () => {
        await setupGroupAndModels({
            manager,
            models: ["fruit"]
        });
        const context = await contextHandler.handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-tenant": "root",
                "x-webiny-cms-endpoint": "manage"
            }
        });

        const models = await context.cms.listModels();

        const schema = await generateSchema({
            context,
            models
        });

        expect(JSON.parse(JSON.stringify(schema))).toEqual(expectedFruitSchema);
        expect(JSON.parse(JSON.stringify(schema.toConfig()))).toEqual(expectedFruitSchemaConfig);

        const result = await graphql({
            schema,
            source: introspectionQuery.source,
            rootValue: {},
            contextValue: context,
            variableValues: {},
            operationName: introspectionQuery.operationName
        });

        expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedFruitSchemaExecutionResult));
    });
});
