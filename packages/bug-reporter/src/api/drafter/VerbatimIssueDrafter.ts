import { IssueDrafter as Abstraction } from "./abstractions.js";

import type { IBugReportPayload } from "../../shared/types.js";

function buildTitle(description: string): string {
    const firstLine = description.split("\n")[0] ?? "";
    const condensed = firstLine.replace(/\s+/g, " ").trim();

    if (condensed === "") {
        return "Bug report from the admin app";
    }
    if (condensed.length <= 80) {
        return condensed;
    }

    return `${condensed.slice(0, 77)}...`;
}

/*
 * The base drafter: the reporter's own words, unchanged.
 *
 * Deliberately has no opinion about AI. Everything factual in the issue — screenshots, environment,
 * timeline — is assembled by `composeIssueBody` regardless, so this produces a complete report on
 * its own. The AI extension decorates it to add a searchable title and steps to reproduce, and
 * falls back to exactly this when it cannot.
 *
 * `stepsToReproduce`, `expected` and `actual` stay empty on purpose rather than being guessed at:
 * `composeIssueBody` omits empty sections, so an unembellished report reads as prose plus evidence
 * rather than as a form with blanks in it.
 */
class VerbatimIssueDrafterImpl implements Abstraction.Interface {
    async execute(payload: IBugReportPayload): Promise<Abstraction.Draft> {
        return {
            title: buildTitle(payload.description),
            summary: payload.description,
            stepsToReproduce: [],
            expected: "",
            actual: ""
        };
    }
}

export const VerbatimIssueDrafter = Abstraction.createImplementation({
    implementation: VerbatimIssueDrafterImpl,
    dependencies: []
});
