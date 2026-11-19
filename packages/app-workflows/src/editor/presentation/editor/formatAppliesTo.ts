import type { EditorActor } from "~/editor/domain/types.js";

export interface AppliesToParams {
    modelName: string;
    // `Headless CMS model`, `Website Builder`.
    appLabel: string;
    // Both null for a workflow that was never saved.
    createdBy: EditorActor | null;
    createdOn: string | null;
}

// `dd.mm.yyyy`: the `de-DE` locale writes the date with dots.
const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
});

/*
 * The header's description: `Applies to {model} ({app}) · Created by {name} on {dd.mm.yyyy}`. The
 * `Created by` part is left out for a workflow that was never saved, or whose date does not parse.
 * Pure.
 */
export const formatAppliesTo = (params: AppliesToParams): string => {
    const applies = `Applies to ${params.modelName} (${params.appLabel})`;
    if (params.createdBy === null || params.createdOn === null) {
        return applies;
    }
    const created = new Date(params.createdOn);
    if (Number.isNaN(created.getTime())) {
        return applies;
    }
    return `${applies} · Created by ${params.createdBy.displayName} on ${DATE_FORMAT.format(created)}`;
};
