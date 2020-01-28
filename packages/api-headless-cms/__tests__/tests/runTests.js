import { PluginsContainer, createSchema } from "@webiny/api";
import testStaticQueries from "./testStaticQueries";
import testDynamicQueries from "./testDynamicQueries";
import headlessPlugins from "../../src/plugins";

export default ({ plugins }) => {
    test("Create schema plugins", async () => {
        const pluginsContainer = new PluginsContainer([plugins, headlessPlugins()]);
        const schema = await createSchema({ plugins: pluginsContainer });
        const gqlSchemas = pluginsContainer.byType("graphql-schema");
        expect(gqlSchemas.length).toBeGreaterThanOrEqual(1);
    });

    testStaticQueries({ plugins });

    testDynamicQueries({ plugins });
};
