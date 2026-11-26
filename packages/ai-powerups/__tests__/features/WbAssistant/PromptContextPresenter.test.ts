import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { GetSettingsUseCase } from "~/admin/features/settings/getSettings/index.js";
import type { IAiPowerUpsSettings } from "~/admin/features/settings/shared/abstractions.js";
import { PromptContextFeature } from "~/admin/presentation/WbAssistant/promptContextFeature.js";

const settings = {
    projects: {
        presets: [
            {
                id: "velo",
                name: "Velo Co.",
                description: "Brand guide",
                defaultReaderPersonaId: "riders",
                defaultWriterPersonaId: "friendly",
                version: 1
            },
            { id: "trade", name: "Velo Co. Trade", version: 1 }
        ]
    },
    readerPersonas: { presets: [{ id: "riders", name: "First-time riders", description: "" }] },
    writerPersonas: {
        presets: [
            { id: "friendly", name: "Friendly expert", description: "" },
            { id: "formal", name: "Formal", description: "" }
        ]
    }
} as unknown as IAiPowerUpsSettings;

const setup = async () => {
    const container = new Container();
    container.registerInstance(GetSettingsUseCase, { execute: async () => settings });
    PromptContextFeature.register(container);
    const { promptContext } = PromptContextFeature.resolve(container);
    await promptContext.load();
    return promptContext;
};

describe("PromptContextPresenter", () => {
    it("sends nothing until something is chosen", async () => {
        const promptContext = await setup();

        expect(promptContext.value()).toBeUndefined();
        expect(promptContext.vm.projects.map(option => option.name)).toEqual([
            "Velo Co.",
            "Velo Co. Trade"
        ]);
    });

    it("chooses a project's default personas with it", async () => {
        const promptContext = await setup();

        promptContext.setProject("velo");

        expect(promptContext.vm.readerPersona?.name).toBe("First-time riders");
        expect(promptContext.vm.writerPersona?.name).toBe("Friendly expert");
        expect(promptContext.value()).toEqual({
            projectId: "velo",
            readerPersonaId: "riders",
            writerPersonaId: "friendly"
        });
    });

    it("keeps the personas the user picked when a project has no defaults", async () => {
        const promptContext = await setup();
        promptContext.setWriterPersona("formal");

        promptContext.setProject("trade");

        expect(promptContext.value()).toEqual({ projectId: "trade", writerPersonaId: "formal" });
    });

    it("attaches a file once, and sends no choice that is no longer a preset", async () => {
        const promptContext = await setup();
        promptContext.setReaderPersona("deleted-since");
        promptContext.attachFiles([{ id: "f1", name: "schedule.md" }]);
        promptContext.attachFiles([
            { id: "f1", name: "schedule.md" },
            { id: "f2", name: "prices.md" }
        ]);
        promptContext.removeFile("f2");

        expect(promptContext.vm.files).toEqual([{ id: "f1", name: "schedule.md" }]);
        expect(promptContext.value()).toEqual({ additionalFileIds: ["f1"] });
    });
});
