/**
 * The quality instructions Generate can carry, by id, and the two passes the Site step reports them
 * as (site-qualities-scoping.md, item 4). A generated component records the ids its prompt carried
 * (`GeneratedComponent.qualityInstructions`); a pass counts as applied to a component only when every
 * one of its ids was there.
 */
export const QUALITY_PROMPT_LINE_IDS = [
    "quality.alt-input",
    "quality.semantic-elements",
    "quality.heading-level",
    "quality.form-labels",
    "quality.focus-visible",
    "quality.image-size",
    "quality.responsive"
] as const;

export const QUALITY_PASSES = {
    accessibility: [
        "quality.alt-input",
        "quality.semantic-elements",
        "quality.heading-level",
        "quality.form-labels",
        "quality.focus-visible"
    ],
    performance: ["quality.image-size"],
    /*
     * Generic: no capture data stands behind it (the narrow capture is a screenshot with no tree), so
     * it asks for behaviour, like the focus outline. The weakest of the seven; see
     * ai-context/issues/mobile-layout-has-no-capture-behind-it.md for what would make it stronger.
     */
    responsiveness: ["quality.responsive"]
} as const satisfies Record<string, ReadonlyArray<(typeof QUALITY_PROMPT_LINE_IDS)[number]>>;

/** Whether a component's recorded instructions include every id of a pass. */
export const carriesPass = (
    recorded: readonly string[] | undefined,
    pass: keyof typeof QUALITY_PASSES
): boolean => QUALITY_PASSES[pass].every(id => (recorded ?? []).includes(id));
