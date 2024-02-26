import { createMockContextHandler } from "../context";
import { AdminSettingsVariant } from "~/types";
import { put } from "@webiny/db-dynamodb";

const createData = (variant: AdminSettingsVariant) => {
    return {
        appUrl: `https://webiny.local/${variant}`
    };
};

describe("Settings service", () => {
    const { handle, entity } = createMockContextHandler();

    const insertAdminSettings = async (variant: AdminSettingsVariant) => {
        return put({
            entity,
            item: {
                PK: "ADMIN#SETTINGS",
                SK: variant,
                data: createData(variant)
            }
        });
    };

    it("should not load settings because there is none in the database", async () => {
        const context = await handle();

        const result = await context.settings.getSettings();

        expect(result).toEqual(null);
    });

    it("should load default settings", async () => {
        await insertAdminSettings("default");

        const context = await handle();

        const result = await context.settings.getSettings();

        expect(result).toEqual({
            ...createData("default")
        });
    });

    it("should load root settings", async () => {
        await insertAdminSettings("default");
        await insertAdminSettings("root");

        const context = await handle();

        const result = await context.settings.getSettings("root");

        expect(result).toEqual({
            ...createData("root")
        });
    });
});
