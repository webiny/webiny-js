import type { PlannedComponent } from "~/domain/artifacts.js";

/**
 * Which copy of a section a text value came from.
 *
 * Plan's model writes each text prop's values from the text observed across every copy of the
 * section, so a value records nothing about where it was seen. Generate showed the first three as
 * examples, and the model built them in: 2424 Tulane's hero shipped another page's address, phone
 * number and lead form, Freehill's contact info another copy's phone number, and Westland's intro
 * other buildings' names. Every copy's texts are on the plan (`members[].digest.texts`, the
 * representative's in `sourceTexts`), so the attribution can be made here, from what is stored.
 *
 * - `representative`: the section the reference image shows has it.
 * - `other`: only another copy has it.
 * - `unattributed`: no copy has it — the Plan model's own wording, kept as before.
 */
export type CopyAttribution = "representative" | "other" | "unattributed";

/** Below this a value is too short to attribute by containment ("A", "80"). */
const MIN_CONTAINED = 8;
const MIN_ATTRIBUTED = 3;

const normalise = (text: unknown): string =>
    (typeof text === "string" ? text : "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

/*
 * Equal, or one contains the other: a value Plan restored from a truncated sample, or a heading split
 * across two text runs by an inline element, is still the same text.
 */
const matches = (value: string, texts: string[]): boolean =>
    texts.some(
        text =>
            value === text ||
            (value.length >= MIN_CONTAINED && text.includes(value)) ||
            (text.length >= MIN_CONTAINED && value.includes(text))
    );

export const createCopyAttribution = (
    component: Pick<PlannedComponent, "representative" | "members" | "sourceTexts">
): ((value: string) => CopyAttribution) => {
    const representative = component.representative;
    const isRepresentative = (member: PlannedComponent["members"][number]) =>
        member.url === representative?.url && member.sectionIndex === representative?.sectionIndex;

    const own = [
        ...(component.sourceTexts ?? []),
        ...(representative?.digest?.texts ?? []),
        ...component.members.filter(isRepresentative).flatMap(member => member.digest?.texts ?? [])
    ]
        .map(normalise)
        .filter(Boolean);
    const others = component.members
        .filter(member => !isRepresentative(member))
        .flatMap(member => member.digest?.texts ?? [])
        .map(normalise)
        .filter(text => text && !matches(text, own));

    return (value: string): CopyAttribution => {
        const text = normalise(value);
        if (text.length < MIN_ATTRIBUTED) {
            return "unattributed";
        }
        if (matches(text, own)) {
            return "representative";
        }
        return matches(text, others) ? "other" : "unattributed";
    };
};

type StructuredValue = NonNullable<PlannedComponent["props"][number]["observedStructured"]>[number];

/*
 * Saved plans hold nulls where the types promise strings (an item field the page left empty), so
 * everything read here is coerced: a value with no text to go on is kept, never a crash in Generate.
 */
const textOf = (text: unknown): string => (typeof text === "string" ? text : "");

const textsOf = (value: StructuredValue): string[] => {
    if (value.kind === "media") {
        return [textOf(value.alt)];
    }
    if (value.kind === "link") {
        return [textOf(value.label)];
    }
    return Object.values(value.fields ?? {}).map(field =>
        typeof field === "string"
            ? field
            : field && typeof field === "object"
              ? textOf("label" in field ? field.label : field.alt)
              : ""
    );
};

/**
 * The structured values the section itself shows.
 *
 * A plan made since values were tagged by copy says so (`member`, 0 the representative). A plan made
 * before carries no tags, and reading an untagged value as the representative's handed 2424 Tulane's
 * hero another page's phone number as a default — so an untagged value is attributed by its text
 * instead, and dropped only when that text is another copy's alone. A value with no text to go on is
 * kept.
 */
export const ownStructuredValues = (
    values: StructuredValue[] | undefined,
    attribute: (value: string) => CopyAttribution
): StructuredValue[] => {
    const all = values ?? [];
    if (all.some(value => value.member !== undefined)) {
        return all.filter(value => (value.member ?? 0) === 0);
    }
    return all.filter(value => {
        const kinds = textsOf(value)
            .filter(text => text.trim())
            .map(attribute);
        return !(kinds.includes("other") && !kinds.includes("representative"));
    });
};
