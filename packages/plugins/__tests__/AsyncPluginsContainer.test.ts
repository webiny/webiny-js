import { AsyncPluginsContainer } from "~/AsyncPluginsContainer";
import { PluginCollection } from "~/types";

describe("AsyncPluginsContainer", () => {
    it("should flatten plugins and run plugin loaders", async () => {
        const pluginsCollection: PluginCollection = [
            { name: "1", type: "type-1" },
            () => Promise.resolve({ name: "2", type: "lazy-type-1" }),
            () =>
                Promise.resolve([
                    { name: "3", type: "lazy-type-2" },
                    { name: "4", type: "lazy-type-3" }
                ]),
            { name: "5", type: "type-2" },
            [
                { name: "6", type: "type-3" },
                [{ name: "7", type: "type-4" }, [{ name: "8", type: "type-5" }]]
            ]
        ];

        const asyncContainer = new AsyncPluginsContainer(pluginsCollection);
        const pluginsContainer = await asyncContainer.init();
        const allPlugins = pluginsContainer.all();
        expect(allPlugins.length).toBe(8);
        expect(allPlugins).toEqual([
            { name: "1", type: "type-1" },
            { name: "2", type: "lazy-type-1" },
            { name: "3", type: "lazy-type-2" },
            { name: "4", type: "lazy-type-3" },
            { name: "5", type: "type-2" },
            { name: "6", type: "type-3" },
            { name: "7", type: "type-4" },
            { name: "8", type: "type-5" }
        ]);
    });
});
