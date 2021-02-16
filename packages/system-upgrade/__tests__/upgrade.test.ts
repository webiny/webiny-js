import {
    DummyContext,
    version500Beta1,
    version500Beta2,
    version500Beta3,
    version500Beta4,
    version500Beta5,
    version500Beta6,
    version500,
    version501,
    version507,
    version510,
    version539
} from "./mocks/plugins";
import { PluginsContainer } from "@webiny/plugins";
import { isSystemUpgradeable, systemUpgrade, systemUpgradePlugins } from "../src";
import { SystemUpgrade } from "../src/types";

const defaultPlugins = [
    version500Beta5(),
    version507(),
    version539(),
    version500Beta6(),
    version500Beta4(),
    version510(),
    version500Beta3(),
    version501(),
    version500Beta2(),
    version500(),
    version500Beta1()
];

const createContext = (version: string, plugins?: SystemUpgrade<DummyContext>[]): DummyContext => {
    const context: DummyContext = {
        plugins: new PluginsContainer(),
        args: [],
        WEBINY_VERSION: version,
        applied: []
    };

    context.plugins.register(plugins || defaultPlugins);

    return context;
};

describe("system upgrade", () => {
    it("should not run any upgrades because there are no plugins", async () => {
        const context = createContext("5.0.0", []);

        await systemUpgrade<DummyContext>(context);

        expect(context.applied).toEqual([]);
    });

    it("should not run any upgrades because there are applicable plugins", async () => {
        const context = createContext("5.0.0-beta.4", [version500Beta4()]);

        await systemUpgrade<DummyContext>(context);

        expect(context.applied).toEqual([]);
    });

    it("should run applicable upgrade plugins in correct order", async () => {
        const context = createContext("5.0.0-beta.7", [
            version500Beta6(),
            version500Beta5(),
            version500Beta4()
        ]);

        await systemUpgrade<DummyContext>(context);

        expect(context.applied).toEqual(["5.0.0-beta.4", "5.0.0-beta.5"]);
    });

    it("should throw an error because at least one plugin has greater version than the code allows", async () => {
        const context = createContext("5.0.0-beta.7", [
            version500Beta6(),
            version500Beta5(),
            version500Beta4(),
            version500()
        ]);

        let ex;
        try {
            await systemUpgrade<DummyContext>(context);
        } catch ({ message, code, data }) {
            ex = {
                message,
                code,
                data
            };
        }

        expect(ex).toEqual({
            message: "Plugin has greater version than the code version is allowing.",
            code: "PLUGIN_VERSION_ERROR",
            data: {
                version: "5.0.0-beta.7",
                plugin: {
                    name: expect.any(String),
                    version: "5.0.0"
                }
            }
        });
    });

    it("should run upgrades on all the mock plugins that are applicable", async () => {
        const context = createContext("5.3.10");

        await systemUpgrade<DummyContext>(context);

        expect(context.applied).toEqual([
            "5.0.0-beta.1",
            "5.0.0-beta.2",
            "5.0.0-beta.3",
            "5.0.0-beta.4",
            "5.0.0-beta.5",
            "5.0.0",
            "5.0.1",
            "5.0.7",
            "5.1.0",
            "5.3.9"
        ]);
    });

    it("should determine that system is upgradeable", async () => {
        const context = createContext("5.3.10");
        const result = await isSystemUpgradeable(context);

        expect(result).toEqual(true);
    });

    it("should determine that system is not upgradeable", async () => {
        const context = createContext("5.0.0-beta.4", [version500Beta4()]);
        const result = await isSystemUpgradeable(context);

        expect(result).toEqual(false);
    });

    it("should fetch all plugins that are applicable", async () => {
        const context = createContext("5.0.1", [
            version500Beta5(),
            version500Beta2(),
            version501(),
            version500Beta4(),
            version500(),
            version500Beta3(),
            version500Beta1()
        ]);

        const results = await systemUpgradePlugins(context);

        expect(results.map(pl => pl.version)).toEqual([
            "5.0.0-beta.1",
            "5.0.0-beta.2",
            "5.0.0-beta.3",
            "5.0.0-beta.4",
            "5.0.0-beta.5",
            "5.0.0",
            "5.0.1"
        ]);
    });
});
