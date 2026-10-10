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
 * family — a background matched to a text colour is no fit, as Generate's prompt treats it — **and**
 * the token's value is the colour that was measured. Before 2026-10-10 it counted any token found, and
 * read 57 of 57 on a run with five sections the wrong colour
 * (ai-context/issues/theme-fit-counts-a-found-token-as-a-fit.md).
 */

/**
 * Within this RGB distance a token is the measured colour; beyond it, up to Cluster's 24, it is near.
 *
 * It separates same-colour from different-colour **on this corpus** and is not a perceptual threshold.
 * Of 1,115 stored bindings, 970 were exact, 25 within 6 (rounding between a computed colour and a
 * written token) and 120 from 6 to 24, which render visibly different. Do not cite it as a measure of
 * what a person can see; it has not earned that.
 */
const MATCHES = 6;

const rgb = (hex: string): [number, number, number] => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
];

const distance = (a: string, b: string): number => {
    const [x, y] = [rgb(a), rgb(b)];
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};
export interface FitCount {
    fitted: number;
    measured: number;
}

/** Colours also count the near ones: the theme has a token close to, but not, the site's colour. */
export interface ColourFitCount extends FitCount {
    near: number;
}

export interface ThemeFit {
    colours: ColourFitCount;
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
        colours: { fitted: 0, measured: 0, near: 0 },
        typeSizes: { fitted: 0, measured: 0 },
        spacing: { fitted: 0, measured: 0 },
        misses: []
    };
    for (const component of components) {
        for (const colour of component.representative?.resolvedColours ?? []) {
            fit.colours.measured++;
            const usable = colour.token && !crossesFamily(colour.role, colour.token.path);
            const away = usable ? distance(colour.hex, colour.token!.hex) : null;
            if (away !== null && away <= MATCHES) {
                fit.colours.fitted++;
            } else if (away !== null) {
                fit.colours.near++;
                fit.misses.push({
                    component: component.name,
                    kind: "colour",
                    value: `${colour.role} ${colour.hex} (near ${colour.token!.path}, ${Math.round(away)} away)`
                });
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
