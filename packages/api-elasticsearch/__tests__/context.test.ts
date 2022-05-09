import elasticsearchContext from "~/index";
import { ContextPlugin } from "@webiny/handler";
import { PluginsContainer } from "@webiny/plugins";
import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { Client } from "@elastic/elasticsearch";
import { ElasticsearchContext } from "~/types";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/client";

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

describe("ElasticsearchContext", () => {
    it("should connect to the elasticsearch", async () => {
        const client = createElasticsearchClient();

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

    it("should initialize the Elasticsearch context plugin", async () => {
        const context: any = {
            plugins: new PluginsContainer()
        };
        const client = createElasticsearchClient();
        const plugin = elasticsearchContext(client);
        /**
         * A context plugin must be created.
         */
        expect(plugin).toBeInstanceOf(ContextPlugin);
        /**
         * Must apply what is required on the context.
         */
        await plugin.apply(context);
        /**
         * A elasticsearch property must be initialized.
         */
        expect(context.elasticsearch).toBeInstanceOf(Client);
    });

    test.each(operators)(`should initialize the plugin "%s"`, async (operator: string) => {
        const context = {
            plugins: new PluginsContainer()
        } as unknown as ElasticsearchContext;
        const client = createElasticsearchClient();
        const plugin = elasticsearchContext(client);

        expect(plugin).toBeInstanceOf(ContextPlugin);
        await plugin.apply(context);
        /**
         * Operators should be registered.
         */
        const registeredOperatorPlugins =
            context.plugins.byType<ElasticsearchQueryBuilderOperatorPlugin>(
                ElasticsearchQueryBuilderOperatorPlugin.type
            );

        const uniqueRegisteredOperatorPlugins = registeredOperatorPlugins.reduce((acc, item) => {
            if (acc.includes(item.getOperator())) {
                return acc;
            }
            acc.push(item.getOperator());
            return acc;
        }, [] as string[]);

        expect(uniqueRegisteredOperatorPlugins).toHaveLength(operators.length);
        const operatorPlugins = registeredOperatorPlugins.filter(pl => {
            return pl.getOperator() === operator;
        });
        /**
         * There is a possibility that we have multiple operators for single operation, depending on the locale.
         */
        expect(operatorPlugins.length).toBeGreaterThan(0);
        /**
         * The operator plugin name must end with the .default so it can be overridden later.
         */
        expect(operatorPlugins[0].name).toMatch(/\.default$/);
    });
});
