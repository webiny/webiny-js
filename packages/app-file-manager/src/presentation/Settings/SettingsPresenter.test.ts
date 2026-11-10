import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { GetSettingsRepository } from "~/features/settings/abstractions.js";
import type { FmSettings } from "~/features/shared/types.js";
import type { FmSettingsInput } from "~/features/shared/types.js";
import { createSettingsPresenter } from "./SettingsPresenter.js";

const DEFAULT_SRC_PREFIX = "https://api.example.com/files/";

/**
 * A settings repository that behaves like the API: an empty or default prefix is stored as
 * "no custom prefix", and reads return the prefix in effect plus the default.
 */
const createRepository = (customSrcPrefix: string) => {
    const saved: FmSettingsInput[] = [];
    let stored = customSrcPrefix;

    const toSettings = (): FmSettings => {
        return {
            uploadMinFileSize: "0",
            uploadMaxFileSize: "26214400",
            srcPrefix: stored || DEFAULT_SRC_PREFIX,
            defaultSrcPrefix: DEFAULT_SRC_PREFIX
        };
    };

    const repository: GetSettingsRepository.Interface = {
        settings: null,
        execute: async () => toSettings(),
        save: async data => {
            saved.push(data);
            stored = data.srcPrefix === DEFAULT_SRC_PREFIX ? "" : data.srcPrefix;
            return toSettings();
        }
    };

    return { repository, saved };
};

const createPresenter = async (customSrcPrefix: string) => {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);

    const { repository, saved } = createRepository(customSrcPrefix);
    const presenter = createSettingsPresenter(repository, container.resolve(FormModelFactory));
    await presenter.load();

    return { presenter, saved };
};

describe("SettingsPresenter: file delivery URL", () => {
    it("leaves the field empty when the default is in effect, and saves it as empty", async () => {
        const { presenter, saved } = await createPresenter("");

        expect(presenter.vm.form.getData().srcPrefix).toBe("");

        expect(await presenter.save()).toBe(true);
        expect(saved[0].srcPrefix).toBe("");
    });

    it("shows a custom prefix", async () => {
        const { presenter } = await createPresenter("https://cdn.example.com/files/");

        expect(presenter.vm.form.getData().srcPrefix).toBe("https://cdn.example.com/files/");
    });

    it("saves a cleared custom prefix as empty, going back to the default", async () => {
        const { presenter, saved } = await createPresenter("https://cdn.example.com/files/");

        presenter.vm.form.setData({ ...presenter.vm.form.getData(), srcPrefix: "" });

        expect(await presenter.save()).toBe(true);
        expect(saved[0].srcPrefix).toBe("");
        expect(presenter.vm.form.getData().srcPrefix).toBe("");
    });
});
