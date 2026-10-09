import type { PlannedComponent, SpacingEntry } from "~/domain/artifacts.js";
import { crossesFamily } from "~/features/stages/generate/colourFamilies.js";

/**
 * How well the job's theme fits what the pipeline measured on the site: of the colours, type sizes and
 * spacing Plan and Generate read off the sections, how many the theme has a token for.
 *
 * The signal extraction's own confidence is not: that is the model's self-report, and six of six
 * themes said "medium". This is measured. It is also the gap the three filed theme-extraction issues
 * describe (26 of 206 colours with no token near them), which option B closes
 * (theme-in-pipeline-build-plan.md). A colour counts as fitted only when its token is of its own
 * family: a background matched to a text colour is no fit, as Generate's prompt treats it.
 */
export interface FitCount {
    fitted: number;
    measured: number;
}

export interface ThemeFit {
    colours: FitCount;
    typeSizes: FitCount;
    spacing: FitCount;
    /** The measured values the theme has no token for, by component, for the review. */
    misses: { component: string; kind: "colour" | "type" | "spacing"; value: string }[];
}

export const themeFit = (
    components: Pick<PlannedComponent, "name" | "representative" | "typeScale">[],
    spacingByComponent: Map<string, SpacingEntry[]> = new Map()
): ThemeFit => {
    const fit: ThemeFit = {
        colours: { fitted: 0, measured: 0 },
        typeSizes: { fitted: 0, measured: 0 },
        spacing: { fitted: 0, measured: 0 },
        misses: []
    };
    for (const component of components) {
        for (const colour of component.representative?.resolvedColours ?? []) {
            fit.colours.measured++;
            if (colour.token && !crossesFamily(colour.role, colour.token.path)) {
                fit.colours.fitted++;
            } else {
                fit.misses.push({
                    component: component.name,
                    kind: "colour",
                    value: `${colour.role} ${colour.hex}`
                });
            }
        }
        for (const step of component.typeScale ?? []) {
            fit.typeSizes.measured++;
            if (step.token) {
                fit.typeSizes.fitted++;
            } else {
                fit.misses.push({
                    component: component.name,
                    kind: "type",
                    value: `${step.fontSize}px`
                });
            }
        }
        for (const entry of spacingByComponent.get(component.name) ?? []) {
            fit.spacing.measured++;
            if (entry.token) {
                fit.spacing.fitted++;
            } else {
                fit.misses.push({
                    component: component.name,
                    kind: "spacing",
                    value: `${entry.kind} ${entry.px}px`
                });
            }
        }
    }
    return fit;
};
