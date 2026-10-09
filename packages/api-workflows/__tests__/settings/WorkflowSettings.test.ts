import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import { SaveWorkflowSettingsUseCase } from "~/features/settings/SaveWorkflowSettings/index.js";

const FUTURE = "2999-01-01T00:00:00.000Z";
const PAST = "2000-01-01T00:00:00.000Z";

const createUseCases = async () => {
    const { context } = await createContextHandler();
    return {
        getSettings: context.container.resolve(GetWorkflowSettingsUseCase),
        saveSettings: context.container.resolve(SaveWorkflowSettingsUseCase)
    };
};

describe("Workflow settings use cases", () => {
    it("returns no exclusions before anything is saved", async () => {
        const { getSettings } = await createUseCases();

        const result = await getSettings.execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({ exclusions: [] });
    });

    it("saves exclusions and hides expired ones unless asked", async () => {
        const { getSettings, saveSettings } = await createUseCases();

        const saved = await saveSettings.execute({
            exclusions: [
                { userId: "user-a", reason: "On leave", endsOn: FUTURE },
                { userId: "user-b", endsOn: PAST },
                { userId: "user-c" }
            ]
        });
        expect(saved.isOk()).toBe(true);

        const active = await getSettings.execute();
        expect(active.value.exclusions).toEqual([
            { userId: "user-a", reason: "On leave", endsOn: FUTURE },
            { userId: "user-c" }
        ]);

        const all = await getSettings.execute({ includeExpired: true });
        expect(all.value.exclusions.map(exclusion => exclusion.userId)).toEqual([
            "user-a",
            "user-b",
            "user-c"
        ]);
    });

    it("rejects a second entry for the same user and keeps the stored record", async () => {
        const { saveSettings, getSettings } = await createUseCases();
        const stored = { exclusions: [{ userId: "user-z", reason: "Parental leave" }] };
        expectOk(await saveSettings.execute(stored));

        const result = await saveSettings.execute({
            exclusions: [{ userId: "user-a" }, { userId: "user-a", endsOn: FUTURE }]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Settings/Validation");
        expect(expectOk(await getSettings.execute({ includeExpired: true }))).toEqual(stored);
    });

    it("lets the last save win", async () => {
        const { getSettings, saveSettings } = await createUseCases();
        expectOk(await saveSettings.execute({ exclusions: [{ userId: "user-a" }] }));

        expectOk(
            await saveSettings.execute({ exclusions: [{ userId: "user-b", reason: "Training" }] })
        );

        const result = expectOk(await getSettings.execute({ includeExpired: true }));
        expect(result).toEqual({ exclusions: [{ userId: "user-b", reason: "Training" }] });
    });
});
