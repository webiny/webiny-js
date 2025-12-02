import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { SettingsModelBuilder } from "~/domain/settings/SettingsModelBuilder.js";
import { SettingsModelFactory } from "~/domain/settings/SettingsModelFactory.js";
import { SettingsModelFactory as FactoryAbstraction } from "~/domain/settings/abstractions.js";

describe("SettingsModelFactory", () => {
    it("should create settings instance with valid data", async () => {
        const container = new Container();
        container.register(SettingsModelBuilder);
        container.register(SettingsModelFactory);

        const settingsModelFactory = container.resolve(FactoryAbstraction);

        const settings = await settingsModelFactory.create({
            name: "app-settings",
            data: {
                theme: "dark",
                language: "en",
                notifications: true
            }
        });

        expect(settings.name).toEqual("app-settings");
        expect(settings.data.theme).toEqual("dark");
        expect(settings.data.language).toEqual("en");
        expect(settings.data.notifications).toEqual(true);
    });

    it("should validate required name field", async () => {
        const container = new Container();
        container.register(SettingsModelBuilder);
        container.register(SettingsModelFactory);

        const settingsModelFactory = container.resolve(FactoryAbstraction);

        await expect(
            settingsModelFactory.create({
                name: "",
                data: { key: "value" }
            })
        ).rejects.toThrow();
    });

    it("should validate data field is a record", async () => {
        const container = new Container();
        container.register(SettingsModelBuilder);
        container.register(SettingsModelFactory);

        const settingsModelFactory = container.resolve(FactoryAbstraction);

        await expect(
            settingsModelFactory.create({
                name: "test-settings",
                data: "invalid" as any
            })
        ).rejects.toThrow();
    });

    it("should handle empty data object", async () => {
        const container = new Container();
        container.register(SettingsModelBuilder);
        container.register(SettingsModelFactory);

        const settingsModelFactory = container.resolve(FactoryAbstraction);

        const settings = await settingsModelFactory.create({
            name: "empty-settings",
            data: {}
        });

        expect(settings.name).toEqual("empty-settings");
        expect(settings.data).toEqual({});
    });

    it("should reuse model class on subsequent creates", async () => {
        const container = new Container();
        container.register(SettingsModelBuilder);
        container.register(SettingsModelFactory);

        const settingsModelFactory = container.resolve(FactoryAbstraction);

        const settings1 = await settingsModelFactory.create({
            name: "settings-1",
            data: { key1: "value1" }
        });

        const settings2 = await settingsModelFactory.create({
            name: "settings-2",
            data: { key2: "value2" }
        });

        expect(settings1.constructor).toBe(settings2.constructor);
    });
});
