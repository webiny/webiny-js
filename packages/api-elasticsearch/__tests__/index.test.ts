import elasticsearchContext from "~/index";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { PluginsContainer } from "@webiny/plugins";
import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { Client } from "@elastic/elasticsearch";

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || "9200";

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
    "lt",
    "lte",
    "not",
    "not_between",
    "not_contains",
    "not_in"
];

describe("ElasticsearchContext", () => {
    it("should initialize the Elasticsearch context plugin", async () => {
        const context: any = {
            plugins: new PluginsContainer()
        };
        const plugin = elasticsearchContext({
            endpoint: `http://localhost:${ELASTICSEARCH_PORT}`
        });
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
        const context: any = {
            plugins: new PluginsContainer()
        };
        const plugin = elasticsearchContext({
            endpoint: `http://localhost:${ELASTICSEARCH_PORT}`
        });
        expect(plugin).toBeInstanceOf(ContextPlugin);
        await plugin.apply(context);
        /**
         * Operators should be registered.
         */
        const registeredOperatorPlugins = context.plugins.byType(
            ElasticsearchQueryBuilderOperatorPlugin.type
        ) as ElasticsearchQueryBuilderOperatorPlugin[];

        expect(registeredOperatorPlugins).toHaveLength(operators.length);
        const operatorPlugins = registeredOperatorPlugins.filter(pl => {
            return pl.getOperator() === operator;
        });
        expect(operatorPlugins).toHaveLength(1);
        /**
         * The operator plugin name must end with the .default so it can be overridden later.
         */
        expect(operatorPlugins[0].name).toMatch(/\.default$/);
    });
});
