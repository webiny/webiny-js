import { PluginsContainer } from "~/index";

const mockPlugins = [
    {
        type: "ui-plugin",
        name: "ui-plugin-1"
    },
    {
        type: "ui-plugin",
        name: "ui-plugin-2"
    },
    {
        type: "ui-plugin",
        name: "ui-plugin-3"
    },
    {
        type: "ui-plugin",
        name: "ui-plugin-4"
    },
    {
        type: "ui-plugin",
        name: "ui-plugin-5"
    },
    {
        type: "api-plugin",
        name: "api-plugin-1"
    },
    {
        type: "api-plugin",
        name: "api-plugin-2"
    },
    {
        type: "api-plugin",
        name: "api-plugin-3"
    }
];

describe("plugins", () => {
    let plugins: PluginsContainer;

    beforeEach(() => {
        plugins = new PluginsContainer();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("plugins.register, plugins.unregister, plugins.byName, plugins.byType", async () => {
        plugins.register(
            {
                type: "test",
                name: "test-1"
            },
            [
                {
                    type: "test",
                    name: "test-2"
                },
                {
                    type: "test",
                    name: "test-3"
                },
                [
                    {
                        type: "test",
                        name: "test-5"
                    },
                    {
                        type: "test",
                        name: "test-6"
                    },
                    [
                        {
                            type: "test",
                            name: "test-7"
                        }
                    ]
                ]
            ],
            {
                _name: "test-4",
                name: "Something...",
                type: "test"
            }
        );

        expect(plugins.byType("test").length).toBe(7);
        expect(plugins.byType("testXYZ").length).toBe(0);

        expect(plugins.byName("test-1")).toEqual({
            type: "test",
            name: "test-1"
        });

        expect(plugins.byName("test-2")).toEqual({
            type: "test",
            name: "test-2"
        });

        expect(plugins.byName("test-3")).toEqual({
            type: "test",
            name: "test-3"
        });

        plugins.unregister("test-3");

        expect(plugins.all().length).toBe(6);
        expect(plugins.byType("test").length).toBe(6);
        expect(plugins.byType("testXYZ").length).toBe(0);

        expect(plugins.byName("test-1")).toEqual({
            type: "test",
            name: "test-1"
        });

        expect(plugins.byName("test-2")).toEqual({
            type: "test",
            name: "test-2"
        });

        expect(plugins.byName("test-4")).toEqual({
            type: "test",
            name: "Something...",
            _name: "test-4"
        });

        expect(plugins.byName("test-3")).toEqual(undefined);
    });

    test(`if present, "init" method must be executed upon adding`, async () => {
        let initialized = false;
        plugins.register({
            type: "test",
            name: "test-1",
            init: () => (initialized = true)
        });

        expect(initialized).toBe(true);
    });

    const findByTypeMethodName = "findByType" as keyof typeof plugins;

    test("load a type only once internally", async () => {
        const byTypeSpy = jest.spyOn(plugins, "byType");
        const findByTypeSpy = jest.spyOn(plugins, findByTypeMethodName);

        plugins.register(mockPlugins);

        for (let i = 0; i < 50; i++) {
            const found = plugins.byType("ui-plugin");
            expect(found).toHaveLength(5);
        }

        expect(findByTypeSpy).toBeCalledTimes(1);
        expect(byTypeSpy).toBeCalledTimes(50);

        jest.restoreAllMocks();
    });

    test("it should clear internal cache when registering a new plugin", async () => {
        const byTypeSpy = jest.spyOn(plugins, "byType");
        const findByTypeSpy = jest.spyOn(plugins, findByTypeMethodName);

        plugins.register(mockPlugins);

        const mockUiPlugins = plugins.byType("ui-plugin");

        const register = [13, 17, 24, 42, 47];
        let registeredAmount = 0;

        for (let i = 0; i < 50; i++) {
            const found = plugins.byType("ui-plugin");
            // found plugins is initially registered amount + newly registered amount
            expect(found).toHaveLength(mockUiPlugins.length + registeredAmount);
            // at given numbers we will register ui-plugin-${number}
            if (register.includes(i)) {
                plugins.register([
                    {
                        type: "ui-plugin",
                        name: `ui-plugin-${i}`,
                        init: () => {
                            return true;
                        }
                    }
                ]);
                registeredAmount++;
            }
        }

        expect(findByTypeSpy).toBeCalledTimes(register.length + 1);
        expect(byTypeSpy).toBeCalledTimes(51);

        jest.restoreAllMocks();
    });

    test("it should clear internal cache when unregistering a plugin", async () => {
        const byTypeSpy = jest.spyOn(plugins, "byType");
        const findByTypeSpy = jest.spyOn(plugins, findByTypeMethodName);

        plugins.register(mockPlugins);

        const mockUiPlugins = plugins.byType("ui-plugin");

        const unregister = [21, 23, 25, 27, 29];
        const startId = 10;
        const endId = 50;

        let dynamicallyRegistered = 0;

        for (let i = startId; i < endId; i++) {
            plugins.register({
                type: "ui-plugin",
                name: `ui-plugin-${i}`
            });
            dynamicallyRegistered++;
        }
        // mock plugins + test registered
        const totalPlugins = dynamicallyRegistered + mockUiPlugins.length;

        let unregisteredAmount = 0;

        for (let i = 0; i < endId; i++) {
            const found = plugins.byType("ui-plugin");
            // found plugins is always initial registered amount reduced by unregistered amount of plugins
            expect(found).toHaveLength(totalPlugins - unregisteredAmount);
            // at given number we will unregister ui-plugin-${i}
            if (unregister.includes(i)) {
                plugins.unregister(`ui-plugin-${i}`);
                unregisteredAmount++;
            }
        }

        // we have mock registration and then first search
        expect(findByTypeSpy).toBeCalledTimes(unregister.length + 2);
        expect(byTypeSpy).toBeCalledTimes(endId + 1);

        jest.restoreAllMocks();
    });

    test("plugins should remain same after shift and pop", () => {
        plugins.register(mockPlugins);

        const uiPlugins = plugins.byType("ui-plugin");

        expect(uiPlugins).toHaveLength(5);

        // remove first plugin
        uiPlugins.shift();
        // remove last plugin
        uiPlugins.pop();

        const afterShiftUiPlugins = plugins.byType("ui-plugin");
        expect(afterShiftUiPlugins).toHaveLength(5);

        plugins.register({
            type: "ui-plugin",
            name: "new-ui-plugin"
        });

        const afterRegisterUiPlugins = plugins.byType("ui-plugin");
        expect(afterRegisterUiPlugins).toHaveLength(6);
    });
});
