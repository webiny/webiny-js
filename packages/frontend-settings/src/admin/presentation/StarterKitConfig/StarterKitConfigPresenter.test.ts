import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { GetFrontendSettingsFeature } from "~/admin/features/getSettings/feature.js";
import { GetFrontendSettingsGateway } from "~/admin/features/getSettings/abstractions.js";
import { UpdateFrontendSettingsFeature } from "~/admin/features/updateSettings/feature.js";
import { UpdateFrontendSettingsGateway } from "~/admin/features/updateSettings/abstractions.js";
import { CACHE_KEY } from "~/admin/features/settingsCache.js";
import { settingsCache } from "~/admin/features/settingsCache.js";
import { StarterKitConfigFeature } from "./feature.js";
import type { IFrontendSettings } from "~/shared/types.js";

const STORED: IFrontendSettings = {
    domain: "https://stored.example.com",
    starterKits: [{ id: "nextjs", label: "Next.js", config: "NEXT_PUBLIC_WEBINY_API_KEY=x" }]
};

const waitForLoad = () => new Promise(resolve => setTimeout(resolve, 0));

describe("StarterKitConfigPresenter", () => {
    let container: Container;
    let saveError: Error | null;

    beforeEach(() => {
        // The settings cache is module-level, so every test starts from an empty one.
        settingsCache.delete(CACHE_KEY);
        saveError = null;

        container = new Container();
        GetFrontendSettingsFeature.register(container);
        UpdateFrontendSettingsFeature.register(container);
        StarterKitConfigFeature.register(container);

        container.registerInstance(GetFrontendSettingsGateway, {
            execute: async () => structuredClone(STORED)
        });
        container.registerInstance(UpdateFrontendSettingsGateway, {
            execute: async () => {
                if (saveError) {
                    throw saveError;
                }
                return true;
            }
        });
    });

    const openDialog = async () => {
        const { presenter } = StarterKitConfigFeature.resolve(container);
        presenter.init();
        await waitForLoad();
        return presenter;
    };

    it("drops an unsaved edit when the dialog is closed and opened again", async () => {
        const presenter = await openDialog();
        expect(presenter.vm.domain).toBe(STORED.domain);

        presenter.setDomain("https://unsaved.example.com");

        // Closing the dialog doesn't touch the presenter. Opening it again calls init().
        presenter.init();
        await waitForLoad();

        expect(presenter.vm.domain).toBe(STORED.domain);
    });

    it("shows the saved domain when the dialog is opened again after saving", async () => {
        const presenter = await openDialog();
        presenter.setDomain("https://saved.example.com");

        const result = await presenter.save();
        expect(result).toEqual({ saved: true });

        presenter.init();
        await waitForLoad();
        expect(presenter.vm.domain).toBe("https://saved.example.com");
    });

    it("reports a failed save instead of rejecting", async () => {
        const presenter = await openDialog();
        saveError = new Error("Not authorized!");

        const result = await presenter.save();

        expect(result).toEqual({ saved: false, message: "Not authorized!" });
        expect(presenter.vm.saving).toBe(false);
    });

    it.each(["example.com", "javascript:alert(1)", "ftp://example.com"])(
        "doesn't allow saving %s as the domain",
        async domain => {
            const presenter = await openDialog();
            presenter.setDomain(domain);

            expect(presenter.vm.domainError).toEqual(expect.any(String));
            expect(presenter.vm.canSave).toBe(false);
        }
    );

    it.each(["https://example.com", "http://localhost:3000", ""])(
        "allows saving %j as the domain",
        async domain => {
            const presenter = await openDialog();
            presenter.setDomain(domain);

            expect(presenter.vm.domainError).toBeNull();
            expect(presenter.vm.canSave).toBe(true);
        }
    );
});
