import type { PickerOption } from "~/components/picker/PickerOption.js";

// What every list a step form reads has: whether it is loading, whether loading failed, and a retry.
export interface StepFormListState {
    loading: boolean;
    failed: boolean;
    retry: () => void;
}

export interface StepFormTeamsOptions extends StepFormListState {
    // The search results, already limited by the picker (R282).
    options: PickerOption[];
    // The chosen teams with their labels, so a chip keeps its name when a search narrows the list.
    selected: PickerOption[];
    search: (query: string) => void;
}

export interface StepFormTransportOption {
    id: string;
    title: string;
    description: string | null;
}

export interface StepFormTransportsOptions extends StepFormListState {
    options: StepFormTransportOption[];
}

export interface StepFormAutomationOption {
    id: string;
    name: string;
    description: string | null;
}

export interface StepFormAutomationsOptions extends StepFormListState {
    // The definitions covering the workflow's model (R274).
    options: StepFormAutomationOption[];
    // The reason shown instead of the cards when there are none.
    emptyText: string;
    // `The automation “{name}” no longer exists.` or null.
    warning: string | null;
    // `Saved settings no longer validate: {error}` or null (QBZ-13).
    settingsWarning: string | null;
    select: (id: string) => void;
}

export interface StepFormAiModelsOptions extends StepFormListState {
    options: PickerOption[];
    // The stored model, also when it is retired (QBZ-8) or the list failed.
    selected: PickerOption | null;
    // The list loaded and has no model.
    empty: boolean;
    search: (query: string) => void;
}

export interface StepFormAiToolOption {
    name: string;
    title: string;
    description: string;
    // The tool can edit the revision under review (R283): the form tags it `Changes content`.
    changesContent: boolean;
}

export interface StepFormAiToolsOptions extends StepFormListState {
    options: StepFormAiToolOption[];
}

// The one value the drawer provides to every renderer of a step form (R234: the presenter owns the data).
export interface StepFormOptions {
    teams: StepFormTeamsOptions;
    transports: StepFormTransportsOptions;
    automations: StepFormAutomationsOptions;
    aiModels: StepFormAiModelsOptions;
    aiTools: StepFormAiToolsOptions;
}
