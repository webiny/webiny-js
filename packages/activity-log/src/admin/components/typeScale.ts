/**
 * The panel's type sizes.
 *
 * These began as the ledger design's own scale — 11, 12 and 13 — and are now the comments panel's,
 * because the two drawers sit side by side and a reader moving between them should not be able to
 * tell that two people built them. Comments reads 15/600 for its title, 13 for a name, 12 for a
 * timestamp or a chip; everything below is that scale, mapped role for role. Its own values live
 * in `collaboration`'s injected stylesheet (`.wby-collab-*`), which is why each entry here names
 * the rule it answers to — the two have to be changed together, and nothing but a comment says so.
 *
 * The one survivor of the original is 13/19 for a row: comments sets 13 with no line-height, and a
 * sentence that wraps on a 384px panel needs one. Kept in a single place so the panel has one
 * answer to "how big is this" rather than a decision at every line — and a home in `admin-ui`
 * would be better still, once something other than these two panels wants a 13px step.
 *
 * `!` on every size because `tailwind-merge` does not recognise these as font sizes, and without
 * it a component's own `text-*` class wins on merge.
 */
export const TYPE = {
    /** The panel's own name, at the top. `.wby-collab-panel__title-text`. */
    title: "text-[15px]! leading-[20px]! font-semibold",
    /** A sentence, of any of the three kinds. */
    sentence: "text-[13px]! leading-[19px]!",
    /** The row's own first line, and anything reading at its weight. `.wby-collab-msg__name`. */
    row: "text-[13px]! leading-[19px]!",
    /** A revision band, and the summary line under the header. `.wby-collab-overview`. */
    band: "text-[13px]! leading-[20px]!",
    /** The label on a control — a dropdown, a sort. `.wby-collab-sort`, `.wby-collab-select`. */
    control: "text-[13px]! leading-[19px]!",
    /** Field names, the fields line, the disclosure note. */
    field: "text-[12px]! leading-[16px]!",
    /** Clocks, counts — everything that orients rather than informs. */
    meta: "text-[12px]! leading-[16px]!",
    /** A timestamp. `.wby-collab-msg__time`: the meta size, muted, and never wrapped. */
    time: "text-[12px]! leading-[16px]! whitespace-nowrap text-neutral-muted"
};
