import { registerPlugins, unregisterPlugin, getPlugin, getPlugins } from "webiny-plugins";

test("plugins - registerPlugins, unregisterPlugin, getPlugin, getPlugins", async () => {
    registerPlugins(
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
            }
        ]
    );

    expect(getPlugins().length).toBe(3);
    expect(getPlugins("test").length).toBe(3);
    expect(getPlugins("testXYZ").length).toBe(0);

    expect(getPlugin("test-1")).toEqual({
        type: "test",
        name: "test-1"
    });

    expect(getPlugin("test-2")).toEqual({
        type: "test",
        name: "test-2"
    });

    expect(getPlugin("test-3")).toEqual({
        type: "test",
        name: "test-3"
    });

    unregisterPlugin("test-3");

    expect(getPlugins().length).toBe(2);
    expect(getPlugins("test").length).toBe(2);
    expect(getPlugins("testXYZ").length).toBe(0);

    expect(getPlugin("test-1")).toEqual({
        type: "test",
        name: "test-1"
    });

    expect(getPlugin("test-2")).toEqual({
        type: "test",
        name: "test-2"
    });

    expect(getPlugin("test-3")).toEqual(undefined);
});

test(`plugins - if present, "init" method must be executed upon adding`, async () => {
    let initialized = false;
    registerPlugins({
        type: "test",
        name: "test-1",
        init: () => (initialized = true)
    });

    expect(initialized).toBe(true);
});
