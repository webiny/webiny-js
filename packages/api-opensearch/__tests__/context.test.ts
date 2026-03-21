import { describe, expect, it } from "vitest";
import opensearchContext from "~/index";
import { ContextPlugin } from "@webiny/api";
import { PluginsContainer } from "@webiny/plugins";
import { OpenSearchQueryBuilderOperatorPlugin } from "~/plugins/definition/OpenSearchQueryBuilderOperatorPlugin";
import { Client } from "@opensearch-project/opensearch";
import { OpenSearchContext } from "~/types";
import { createOpenSearchClient } from "./helpers";
import { Container } from "@webiny/di";

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
        const context = {
            container: new Container(),
            plugins: new PluginsContainer()
        } as OpenSearchContext;
        const client = createOpenSearchClient();
        const plugin = opensearchContext(client);
        /**
         * A context plugin must be created.
         */
        expect(plugin).toBeInstanceOf(ContextPlugin);
        /**
         * Must apply what is required on the context.
         */
        await plugin.apply(context);
        /**
         * A opensearch property must be initialized.
         */
        expect(context.opensearch).toBeInstanceOf(Client);
    });

    it.each(operators)(`should initialize the plugin "%s"`, async (operator: string) => {
        const context = {
            container: new Container(),
            plugins: new PluginsContainer()
        } as OpenSearchContext;
        const client = createOpenSearchClient();
        const plugin = opensearchContext(client);

        expect(plugin).toBeInstanceOf(ContextPlugin);
        await plugin.apply(context);
        /**
         * Operators should be registered.
         */
        const registeredOperatorPlugins =
            context.plugins.byType<OpenSearchQueryBuilderOperatorPlugin>(
                OpenSearchQueryBuilderOperatorPlugin.type
            );

        const uniqueRegisteredOperatorPlugins = registeredOperatorPlugins.reduce<string[]>((acc, item) => {
            if (acc.includes(item.getOperator())) {
                return acc;
            }
            acc.push(item.getOperator());
            return acc;
        }, []);

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
