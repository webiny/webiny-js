import { describe, expect, it } from "vitest";
import { generateSchema } from "~/graphql/generateSchema.js";
import { useHandler } from "~tests/testHelpers/useHandler.js";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler.js";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";
import { expectedEmptySchema } from "./__expected/read/expectedEmptySchema.js";
import { expectedFruitSchema } from "./__expected/read/expectedFruitSchema.js";
import { expectedFruitSchemaConfig } from "./__expected/read/expectedFruitSchemaConfig.js";
import { graphql } from "graphql";
import { introspectionQuery } from "~tests/graphql/schema/__query/introspectionQuery.js";

const expectedEmptySchemaExecutionResult = require("./__expected/read/expectedEmptySchemaExecutionResult.json");
const expectedFruitSchemaExecutionResult = require("./__expected/read/expectedFruitSchemaExecutionResult.json");

describe("generate graphql read schema", () => {
    const manager = useGraphQLHandler({
        path: "manage"
    });

    const contextHandler = useHandler({
        path: "read"
    });

    it("should generate and execute introspection on basic empty schema", async () => {
        const context = await contextHandler.handler({
            path: "/cms/read/en-US",
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
            path: "/cms/read/en-US",
            headers: {
                "x-tenant": "root",
                "x-webiny-cms-endpoint": "read"
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
