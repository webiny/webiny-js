import { PluginsContainer } from "@webiny/plugins";
import { getElasticsearchOperators, getElasticsearchOperatorPluginsByLocale } from "~/operators";

describe("operators", () => {
    const container = new PluginsContainer(getElasticsearchOperators());

    it("should use japanese contains operator instead of the default one", () => {
        const jaJpPlugins = getElasticsearchOperatorPluginsByLocale(container, "ja-jp");

        expect(jaJpPlugins).toMatchObject({
            contains: {
                name: "elasticsearch.queryBuilder.operator.contains.japanese"
            }
        });
        expect(jaJpPlugins).not.toMatchObject({
            contains: {
                name: "elasticsearch.queryBuilder.operator.contains.default"
            }
        });

        const jaPlugins = getElasticsearchOperatorPluginsByLocale(container, "ja");
        expect(jaPlugins).toMatchObject({
            contains: {
                name: "elasticsearch.queryBuilder.operator.contains.japanese"
            }
        });
        expect(jaPlugins).not.toMatchObject({
            contains: {
                name: "elasticsearch.queryBuilder.operator.contains.default"
            }
        });
    });
});
