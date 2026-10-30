import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { AiModel } from "~/editor/domain/types.js";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { getAiModelOptions } from "./getAiModelOptions.js";

const MODELS: AiModel[] = [
    {
        id: "anthropic/claude-balanced",
        name: "Claude Balanced",
        providerId: "anthropic",
        providerName: "Anthropic",
        description: "Fast, low-cost checks"
    },
    { id: "openai/gpt-fast", name: "GPT Fast", providerId: "openai", providerName: "OpenAI" }
];

const RETIRED_WARNING =
    "The AI model “anthropic/gone” is no longer offered. Choose another model; until then this step fails when reached.";

describe("getAiModelOptions (R275, QBZ-8, QBZ-89)", () => {
    it("lists the models with the provider name as the description", () => {
        const result = getAiModelOptions({
            models: MODELS,
            loaded: true,
            query: "",
            selectedId: null
        });

        expect(result.options).toEqual([
            createPickerOption({
                id: "anthropic/claude-balanced",
                label: "Claude Balanced",
                description: "Anthropic · Fast, low-cost checks"
            }),
            createPickerOption({ id: "openai/gpt-fast", label: "GPT Fast", description: "OpenAI" })
        ]);
        expect(result.selected).toBeNull();
        expect(result.empty).toBe(false);
    });

    it("filters by the query on the model and the provider name, case-insensitively", () => {
        const byModel = getAiModelOptions({
            models: MODELS,
            loaded: true,
            query: " gpt ",
            selectedId: null
        });
        const byProvider = getAiModelOptions({
            models: MODELS,
            loaded: true,
            query: "ANTHRO",
            selectedId: null
        });

        expect(byModel.options.map(option => option.id)).toEqual(["openai/gpt-fast"]);
        expect(byProvider.options.map(option => option.id)).toEqual(["anthropic/claude-balanced"]);
    });

    it("keeps the selected model whatever the query", () => {
        const result = getAiModelOptions({
            models: MODELS,
            loaded: true,
            query: "gpt",
            selectedId: "anthropic/claude-balanced"
        });

        expect(result.selected?.label).toBe("Claude Balanced");
        expect(result.selected?.warning).toBeNull();
    });

    it("shows a stored model the list does not offer as retired, with the warning (QBZ-8)", () => {
        const result = getAiModelOptions({
            models: MODELS,
            loaded: true,
            query: "",
            selectedId: "anthropic/gone"
        });

        expect(result.selected).toEqual(
            createPickerOption({
                id: "anthropic/gone",
                label: "anthropic/gone (no longer offered)",
                warning: RETIRED_WARNING
            })
        );
    });

    it("keeps a stored model shown without a retired warning while the list is not loaded", () => {
        const result = getAiModelOptions({
            models: [],
            loaded: false,
            query: "",
            selectedId: "anthropic/claude-balanced"
        });

        expect(result.selected).toEqual(
            createPickerOption({
                id: "anthropic/claude-balanced",
                label: "anthropic/claude-balanced"
            })
        );
        expect(result.empty).toBe(false);
    });

    it("is empty only when a loaded list has no model", () => {
        expect(
            getAiModelOptions({ models: [], loaded: true, query: "", selectedId: null }).empty
        ).toBe(true);
        expect(
            getAiModelOptions({ models: [], loaded: false, query: "", selectedId: null }).empty
        ).toBe(false);
        expect(
            getAiModelOptions({ models: MODELS, loaded: true, query: "zzz", selectedId: null })
                .empty
        ).toBe(false);
    });
});
