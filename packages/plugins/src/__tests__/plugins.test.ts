import { registerPlugins, unregisterPlugin, getPlugin, getPlugins } from "@webiny/plugins";

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

    expect(getPlugins().length).toBe(7);

    expect(getPlugins("test").length).toBe(7);
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

    expect(getPlugins().length).toBe(6);
    expect(getPlugins("test").length).toBe(6);
    expect(getPlugins("testXYZ").length).toBe(0);

    expect(getPlugin("test-1")).toEqual({
        type: "test",
        name: "test-1"
    });

    expect(getPlugin("test-2")).toEqual({
        type: "test",
        name: "test-2"
    });

    expect(getPlugin("test-4")).toEqual({
        type: "test",
        name: "Something...",
        _name: "test-4"
    });

    expect(getPlugin("test-3")).toEqual(undefined);
});

test("plugins - registerPlugins, unregisterPlugin, getPlugin, getPlugins", async () => {
    try {
        registerPlugins({
            type: "test",
            __name: "test-1",
            namE: "test-1"
        });
    } catch (e) {
        return;
    }

    throw Error(`Error should've been thrown.`);
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
