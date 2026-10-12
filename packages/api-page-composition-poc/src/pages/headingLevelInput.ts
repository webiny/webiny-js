import type { CapturedNode } from "@webiny/api-component-extraction/domain/artifacts.js";
import { sectionHeadings } from "@webiny/api-component-extraction/features/stages/generate/sectionHeadings.js";
import type { ComponentManifest } from "@webiny/website-builder-sdk";

/** The input a component declares to take its main heading's level per page. */
export const HEADING_LEVEL_INPUT = "headingLevel";

/**
 * This instance's heading level: the level of the first heading the page's own section marks up.
 *
 * A component is generated once for a cluster, and the same section can be the `h1` on one page and
 * an `h2` on another (19 of 180 multi-copy components, `item4-data-replay.md`). A level written into
 * the component's code is wrong on some pages by construction, so a component that declares a
 * `headingLevel` input gets it set per page, from that page's section, like any other per-page value.
 *
 * Nothing is set when the component declares no such input, or when this page's section marks up no
 * heading; the component's default then stands.
 *
 * **What one input cannot carry: the sub-headings.** Only the main heading's level is set per page.
 * The others are rendered at the same distance below it as on the page the component was generated
 * from. Of the 19 components whose main level differs between pages, that is right for 8. In the
 * other 11 the sub-headings differ too (one page's h2 cards are another page's h3s), and they come out
 * at the generated page's distance. See `ai-context/issues/sub-heading-levels-can-differ-between-pages.md`.
 */
export const headingLevelInput = (params: {
    node: CapturedNode;
    manifest: ComponentManifest;
}): Record<string, string> => {
    const declares = (params.manifest.inputs ?? []).some(
        input => (input as { name?: string }).name === HEADING_LEVEL_INPUT
    );
    if (!declares) {
        return {};
    }
    const first = sectionHeadings(params.node)[0];
    return first ? { [HEADING_LEVEL_INPUT]: `h${first.level}` } : {};
};
