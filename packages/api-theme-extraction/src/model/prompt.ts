import { CANONICAL_SLOTS } from "@webiny/theme-common";
import type { ModelPayload } from "./payload.js";

/**
 * The instructions sent with the crawl — see the design brief, section 10.5.
 *
 * The slot list is generated from `CANONICAL_SLOTS`, the same source the validator checks against.
 * Hand-writing it into the prompt would let the two drift, and the failure mode of that drift is
 * quiet: the model dutifully fills slots that no longer exist and every one of them is rejected.
 */

const slotList = (): string => {
    const byType = new Map<string, string[]>();

    for (const slot of CANONICAL_SLOTS) {
        const paths = byType.get(slot.type) ?? [];
        paths.push(slot.path);
        byType.set(slot.type, paths);
    }

    return [...byType.entries()]
        .map(([type, paths]) => `${type}:\n${paths.map(path => `  - ${path}`).join("\n")}`)
        .join("\n\n");
};

export const buildSystemPrompt = (): string => {
    return `You turn measurements taken from a real website into a design-token theme.

You will be given an inventory of colours, type sizes, spacing, radii and shadows that were measured
from the site's rendered pages, plus screenshots. Your job is judgement, not counting: the counting is
already done. Decide which of the observed values are the site's deliberate design decisions, collapse
near-identical values into single steps, and assign them to the slots below.

## The slots you may assign

${slotList()}

## Rules

1. Use ONLY the paths listed above, spelled exactly. Any other path is discarded.
2. Slots under \`type.\` take an object of font properties (fontFamily, fontSize, fontWeight,
   lineHeight, letterSpacing) — not a string. Every other slot takes a single string value.
3. Prefer values that actually appear in the inventory. Round or regularise them where the site is
   clearly approximating a scale (e.g. 15.008px is 15px; 23px, 24px and 25px are probably one step),
   but do not invent a palette the site does not have.
4. \`share\` tells you how much of what we looked at used that value. It measures prominence, not
   importance: a page's background is always the largest share and is rarely the brand colour, and an
   accent used once on the primary call to action may be the most important colour on the site. Use the
   screenshots to tell these apart.
5. You may leave slots unassigned. Anything you omit falls back to a sensible default, so omitting a
   slot is much better than guessing at it.
6. Record every judgement you were not confident about in \`uncertain\`, with a reason a designer would
   understand. This is not optional and it is not a formality — someone will review this theme, and
   what you were unsure of is the most useful thing you can tell them.
7. Put dark-mode values in \`darkTokens\`, and only for colour and shadow slots. If the inventory says
   the site has no real dark variant, leave \`darkTokens\` empty rather than inventing one.
8. \`summary\` is one or two sentences describing the design you found, for a human reading the result.

Be conservative. A theme with twelve confident assignments and an honest list of what you could not
determine is far more useful than one with sixty guesses.`;
};

export interface UserMessageParams {
    payload: ModelPayload;
    /** Present when the crawl found a real dark variant. */
    includeDarkGuidance: boolean;
}

export const buildUserMessage = ({ payload, includeDarkGuidance }: UserMessageParams): string => {
    const section = (title: string, values: { value: string; share: number }[]): string => {
        if (values.length === 0) {
            return `### ${title}\n(none observed)`;
        }

        const lines = values
            .map(entry => `  ${entry.value} — ${Math.round(entry.share * 100)}%`)
            .join("\n");

        return `### ${title}\n${lines}`;
    };

    const darkNote = includeDarkGuidance
        ? "The site ships a real dark variant; its colours were measured separately and are listed below."
        : "The site has no meaningful dark variant. Leave `darkTokens` empty — a dark theme will be derived from the light one.";

    return `Site: ${payload.source.entryUrl}
Pages read: ${payload.source.sampledUrls.join(", ")}
Measured at a viewport width of ${payload.source.viewportWidth}px.

${darkNote}

## Inventory

${section("Colours", payload.colors)}

${section("Font sizes", payload.fontSizes)}

${section("Font families", payload.fontFamilies)}

${section("Font weights", payload.fontWeights)}

${section("Line heights", payload.lineHeights)}

${section("Spacing", payload.spacing)}

${section("Corner radii", payload.radii)}

${section("Shadows", payload.shadows)}

${
    payload.fonts.length > 0
        ? `## Web fonts the browser actually loaded\n${payload.fonts
              .map(font => `  ${font.family ?? "(unknown family)"} — ${font.url}`)
              .join("\n")}`
        : "## Web fonts\nNo web fonts were loaded; the site uses system fonts."
}

The screenshots that follow show the pages these numbers came from.`;
};
