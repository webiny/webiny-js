import type { GeneratedComponentDto, ValidationResultDto } from "~/shared/types.js";

export type GenerateFilter = "all" | "attention" | "undecided" | "accepted" | "rejected";

export const GENERATE_FILTERS: { value: GenerateFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "attention", label: "Needs attention" },
    { value: "undecided", label: "Undecided" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" }
];

type CheckKey = keyof GeneratedComponentDto["validation"];

/** The three checks Generate runs on every component, as passed and as failed. */
export const CHECKS: { key: CheckKey; passed: string; failed: string }[] = [
    { key: "textPreservation", passed: "Text preserved", failed: "Text not preserved" },
    { key: "contractConformance", passed: "Contract conformant", failed: "Contract not met" },
    { key: "tokenBinding", passed: "Token binding", failed: "Token binding failed" }
];

const checkOf = (component: GeneratedComponentDto, key: CheckKey): ValidationResultDto =>
    component.validation[key];

/** A component needs attention when any of its three checks failed. */
export const needsAttention = (component: GeneratedComponentDto): boolean =>
    CHECKS.some(check => !checkOf(component, check.key).passed);

const decisionOf = (decisions: Record<string, string>, component: GeneratedComponentDto) =>
    decisions[component.signature] ?? "none";

const matches = (
    component: GeneratedComponentDto,
    decisions: Record<string, string>,
    filter: GenerateFilter
): boolean => {
    const decision = decisionOf(decisions, component);
    switch (filter) {
        case "attention":
            return needsAttention(component);
        case "undecided":
            return decision !== "accepted" && decision !== "rejected";
        case "accepted":
            return decision === "accepted";
        case "rejected":
            return decision === "rejected";
        default:
            return true;
    }
};

export const filterCounts = (
    components: GeneratedComponentDto[],
    decisions: Record<string, string>
): Record<GenerateFilter, number> => {
    const count = (filter: GenerateFilter) =>
        components.filter(component => matches(component, decisions, filter)).length;
    return {
        all: components.length,
        attention: count("attention"),
        undecided: count("undecided"),
        accepted: count("accepted"),
        rejected: count("rejected")
    };
};

/** The filter's components: those needing attention first, then the most-used. */
export const visibleComponents = (
    components: GeneratedComponentDto[],
    decisions: Record<string, string>,
    filter: GenerateFilter
): GeneratedComponentDto[] =>
    components
        .filter(component => matches(component, decisions, filter))
        .sort(
            (a, b) =>
                Number(needsAttention(b)) - Number(needsAttention(a)) || b.pageCount - a.pageCount
        );

/** One line per failed check: what failed and after how many attempts, then what the check found. */
export const failureBanners = (
    component: GeneratedComponentDto
): { title: string; detail: string }[] =>
    CHECKS.filter(check => !checkOf(component, check.key).passed).map(check => {
        const failures = checkOf(component, check.key).failures;
        const shown = failures.slice(0, 3).join("; ");
        const more = failures.length > 3 ? `; and ${failures.length - 3} more` : "";
        return {
            title:
                component.attempts > 1
                    ? `${check.failed} after ${component.attempts} attempts.`
                    : `${check.failed}.`,
            detail: `${shown}${more}`
        };
    });

/**
 * What a regeneration sends the model: the issues picked, then the note. Empty when both are, which
 * generates the component again from its original prompt.
 */
export const regenerateInstruction = (issues: string[], note: string): string => {
    const lines = [];
    if (issues.length > 0) {
        lines.push(`What's off: ${issues.join(", ")}.`);
    }
    if (note.trim()) {
        lines.push(note.trim());
    }
    return lines.join("\n");
};
