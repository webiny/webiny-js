/**
 * Path encoding for changeset entries.
 *
 * A path is always fully qualified from the target root, because item ids are unique only within
 * a single array and not within an entry. Two sibling blocks can legitimately hold nested items
 * carrying the same `_id`, so a path that starts mid-tree is ambiguous.
 *
 * Three segment kinds:
 *
 *   - `field` — a model field, joined with `.`
 *   - `item`  — an identified item in a repeatable object or dynamic zone, rendered `#<id>`
 *   - `index` — a positional item, rendered `[<n>]`
 *
 * `index` covers two distinct cases and the difference matters. A list of scalars has no identity
 * to key on and is positional by nature. A list of objects whose items carry no `_id` is
 * positional only because identity has not been established yet: every entry written before
 * stable ids landed is in that state until its next save, so positional segments are a permanent
 * part of the encoding rather than a transitional one.
 *
 * Field ids are `a-zA-Z0-9` and item ids are `[a-z0-9]{12}`, so no separator can appear inside a
 * segment and no escaping is needed. `assertEncodable` holds that assumption to account.
 */

export type PathSegment =
    | { kind: "field"; fieldId: string }
    | { kind: "item"; id: string }
    | { kind: "index"; index: number };

const UNSAFE_SEGMENT = /[.#[\]]/;

const assertEncodable = (value: string): string => {
    if (UNSAFE_SEGMENT.test(value)) {
        throw new Error(
            `Cannot encode activity log path segment "${value}": it contains a separator character.`
        );
    }
    return value;
};

export const fieldSegment = (fieldId: string): PathSegment => ({ kind: "field", fieldId });

export const itemSegment = (id: string): PathSegment => ({ kind: "item", id });

export const indexSegment = (index: number): PathSegment => ({ kind: "index", index });

/**
 * Segment for one item of a list, preferring its stable id and falling back to its position.
 *
 * The fallback is not a workaround to be removed once stable ids ship everywhere. An installation
 * upgraded past that point holds a mixture of id-bearing and id-less entries indefinitely, since
 * an entry only gains ids on its next write.
 */
export const listItemSegment = (item: unknown, index: number): PathSegment => {
    if (item !== null && typeof item === "object" && !Array.isArray(item)) {
        const id = (item as { _id?: unknown })._id;
        if (typeof id === "string" && id !== "") {
            return itemSegment(id);
        }
    }
    return indexSegment(index);
};

export const encodePath = (segments: PathSegment[]): string => {
    let path = "";

    for (const segment of segments) {
        if (segment.kind === "field") {
            path +=
                path === ""
                    ? assertEncodable(segment.fieldId)
                    : `.${assertEncodable(segment.fieldId)}`;
            continue;
        }

        if (segment.kind === "item") {
            path += `#${assertEncodable(segment.id)}`;
            continue;
        }

        path += `[${segment.index}]`;
    }

    return path;
};

/** Splits an encoded path back into its rendered segments. */
export const splitPathSegments = (path: string): string[] => {
    return (
        path.match(/(?:^|\.)[a-zA-Z0-9]+|#[a-z0-9]+|\[\d+\]/g)?.map(s => s.replace(/^\./, "")) ?? []
    );
};

const joinPathSegments = (segments: string[]): string => {
    let path = "";

    for (const segment of segments) {
        if (segment.startsWith("#") || segment.startsWith("[")) {
            path += segment;
            continue;
        }
        path += path === "" ? segment : `.${segment}`;
    }

    return path;
};

/**
 * The nearest common ancestor of a set of paths, used to roll a changeset up once it exceeds the
 * cap. Returns an empty string when the paths share no prefix, which reads as "the whole target".
 */
export const commonParentPath = (paths: string[]): string => {
    if (paths.length === 0) {
        return "";
    }

    let common = splitPathSegments(paths[0]!);

    for (const path of paths.slice(1)) {
        const segments = splitPathSegments(path);
        let shared = 0;

        while (
            shared < common.length &&
            shared < segments.length &&
            common[shared] === segments[shared]
        ) {
            shared++;
        }

        common = common.slice(0, shared);

        if (common.length === 0) {
            return "";
        }
    }

    return joinPathSegments(common);
};
