import { describe, expect, it } from "vitest";
import { createOpenSearchContext } from "~/index";
import { Context, ContextPlugin } from "@webiny/api";
import { OpenSearchQueryBuilderOperatorPlugin } from "~/plugins/definition/OpenSearchQueryBuilderOperatorPlugin";
import { Client } from "@opensearch-project/opensearch";
import { createOpenSearchClient } from "./helpers";

/**
 * If adding new default operators, they must be added here as well.
 */
const operators = [
    "between",
    "contains",
    "eq",
    "gt",
    "gte",
    "in",
    "and_in",
    "lt",
    "lte",
    "not",
    "not_between",
    "not_contains",
    "not_in",
    "startsWith",
    "not_startsWith"
];

describe("OpenSearchContext", () => {
    it("should connect to the opensearch", async () => {
        const client = createOpenSearchClient();

        const response = await client.cat.health({
            format: "json"
        });

        expect(response).toMatchObject({
            body: {
                "0": {
                    epoch: expect.any(String),
                    cluster: expect.any(String),
                    status: expect.stringMatching(/green|yellow/)
                }
            },
            statusCode: 200
        });
    });

    it("should initialize the OpenSearch context plugin", async () => {
        const context = new Context({
            plugins: [],
            WEBINY_VERSION: "0.0.0"
        });
        const client = createOpenSearchClient();
        const plugin = createOpenSearchContext(client);
        /**
         * A context plugin must be created.
         */
        expect(plugin).toBeInstanceOf(ContextPlugin);
        /**
         * Must apply what is required on the context.
         */
        // @ts-expect-error
        await plugin.apply(context);
        /**
         * A opensearch property must be initialized.
         */
        // @ts-expect-error
        expect(context.opensearch).toBeInstanceOf(Client);
    });

    it.each(operators)(`should initialize the plugin "%s"`, async (operator: string) => {
        const context = new Context({
            plugins: [],
            WEBINY_VERSION: "0.0.0"
        });
        const client = createOpenSearchClient();
        const plugin = createOpenSearchContext(client);

        expect(plugin).toBeInstanceOf(ContextPlugin);
        // @ts-expect-error
        await plugin.apply(context);
        /**
         * Operators should be registered.
         */
        const registeredOperatorPlugins =
            context.plugins.byType<OpenSearchQueryBuilderOperatorPlugin>(
                OpenSearchQueryBuilderOperatorPlugin.type
            );

        const uniqueRegisteredOperatorPlugins = registeredOperatorPlugins.reduce<string[]>(
            (acc, item) => {
                if (acc.includes(item.getOperator())) {
                    return acc;
                }
                acc.push(item.getOperator());
                return acc;
            },
            []
        );

        expect(uniqueRegisteredOperatorPlugins).toHaveLength(operators.length);
        const operatorPlugins = registeredOperatorPlugins.filter(pl => {
            return pl.getOperator() === operator;
        });
        /**
         * There is a possibility that we have multiple operators for single operation.
         */
        expect(operatorPlugins.length).toBeGreaterThan(0);
        /**
         * The operator plugin name must end with the .default so it can be overridden later.
         */
        expect(operatorPlugins[0].name).toMatch(/\.default$/);
    });
});
