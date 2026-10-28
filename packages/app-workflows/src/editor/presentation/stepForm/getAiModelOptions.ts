import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { AiModel } from "~/editor/domain/types.js";

export interface AiModelOptionsParams {
    models: AiModel[];
    // The list loaded successfully (it may still be empty).
    loaded: boolean;
    query: string;
    selectedId: string | null;
}

export interface AiModelOptions {
    options: PickerOption[];
    selected: PickerOption | null;
    empty: boolean;
}

function toDescription(model: AiModel): string {
    if (model.description) {
        return `${model.providerName} · ${model.description}`;
    }
    return model.providerName;
}

function toOption(model: AiModel): PickerOption {
    return {
        id: model.id,
        label: model.name,
        description: toDescription(model),
        warning: null,
        muted: false,
        disabled: false,
        icon: null,
        note: null
    };
}

function matches(model: AiModel, needle: string): boolean {
    return (
        model.name.toLowerCase().includes(needle) ||
        model.providerName.toLowerCase().includes(needle)
    );
}

/*
 * The model picker's options (R275): client-side search over the loaded list; the stored model
 * always shows. One the loaded list does not offer is retired (QBZ-8): its label says so and it
 * carries the warning, which does not block saving. While the list is not loaded the stored id
 * stands for the name, with no warning because nothing is known.
 */
export const getAiModelOptions = (params: AiModelOptionsParams): AiModelOptions => {
    const { models, loaded, query, selectedId } = params;
    const needle = query.trim().toLowerCase();
    const options = models.filter(model => matches(model, needle)).map(toOption);

    let selected: PickerOption | null = null;
    if (selectedId !== null) {
        const known = models.find(model => model.id === selectedId);
        if (known) {
            selected = toOption(known);
        } else if (loaded) {
            selected = {
                id: selectedId,
                label: `${selectedId} (no longer offered)`,
                description: null,
                warning: `The AI model “${selectedId}” is no longer offered. Choose another model; until then this step fails when reached.`,
                muted: false,
                disabled: false,
                icon: null,
                note: null
            };
        } else {
            selected = {
                id: selectedId,
                label: selectedId,
                description: null,
                warning: null,
                muted: false,
                disabled: false,
                icon: null,
                note: null
            };
        }
    }

    return { options, selected, empty: loaded && models.length === 0 };
};
