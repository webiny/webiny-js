/*
 * Reads the areas a `/e2e` PR comment asks for (e2e/README.md, "Areas" and "In CI"). The comment is
 * untrusted input: only names that match `NAME_PATTERN` and resolve through the area list become
 * tags, and nothing else from the comment is ever echoed back, not even in an error.
 *
 * No imports, so CI runs it with plain `node` (selectE2eAreas.ts) before any dependency is
 * installed.
 */

/** A part of an area, as e2e/areas.ts declares it. Its tag is `<area>-<part>`. */
export interface SelectablePart {
    name: string;
    aliases?: readonly string[];
}

/** An area, as e2e/areas.ts declares it. Its tag is its name. */
export interface SelectableArea {
    name: string;
    aliases?: readonly string[];
    parts?: readonly SelectablePart[];
}

/** What a name in the comment selects: an area's tag, or a part's tag and its area. */
interface Selector {
    tag: string;
    area: string;
}

/** Every area is selected: `/e2e` alone. The tests run without `--tag`. */
export interface E2eCommandAll {
    ok: true;
    tags: [];
    label: "all";
}

/** Only these areas and parts: `--tag <tags>`. */
export interface E2eCommandSelection {
    ok: true;
    tags: string[];
    label: string;
}

/** The comment names something that is not an area. `message` holds no raw comment text. */
export interface E2eCommandRejection {
    ok: false;
    message: string;
}

export type E2eCommand = E2eCommandAll | E2eCommandSelection | E2eCommandRejection;

// Lower case letters, digits and dashes, and short, so a name can be shown back safely.
export const NAME_PATTERN = /^[a-z0-9-]{1,64}$/;

const partTag = (area: SelectableArea, part: SelectablePart) => {
    return `${area.name}-${part.name}`;
};

/**
 * Every name the comment may use, and what it selects: an area by its name or an alias; a part by
 * its tag, an alias of its own, or `<area alias>-<part>`. Throws when two of them collide.
 */
export const createAreaSelectors = (areas: readonly SelectableArea[]): Map<string, Selector> => {
    const selectors = new Map<string, Selector>();
    const add = (name: string, selector: Selector) => {
        if (!NAME_PATTERN.test(name)) {
            throw new Error(`"${name}" (${selector.tag}) must match ${NAME_PATTERN}.`);
        }
        const existing = selectors.get(name);
        if (existing) {
            throw new Error(`"${name}" selects both ${existing.tag} and ${selector.tag}.`);
        }
        selectors.set(name, selector);
    };

    for (const area of areas) {
        const areaSelector = { tag: area.name, area: area.name };
        add(area.name, areaSelector);
        for (const alias of area.aliases || []) {
            add(alias, areaSelector);
        }
        for (const part of area.parts || []) {
            const tag = partTag(area, part);
            const partSelector = { tag, area: area.name };
            add(tag, partSelector);
            for (const alias of part.aliases || []) {
                add(alias, partSelector);
            }
            for (const alias of area.aliases || []) {
                add(`${alias}-${part.name}`, partSelector);
            }
        }
    }

    return selectors;
};

/** The names the comment may use, for the message that rejects it. */
export const describeValidNames = (areas: readonly SelectableArea[]): string => {
    const names: string[] = [];
    for (const area of areas) {
        const aliases = area.aliases || [];
        names.push(aliases.length ? `${area.name} (${aliases.join(", ")})` : area.name);
        for (const part of area.parts || []) {
            const partAliases = [
                ...(part.aliases || []),
                ...aliases.map(alias => `${alias}-${part.name}`)
            ];
            const tag = partTag(area, part);
            names.push(partAliases.length ? `${tag} (${partAliases.join(", ")})` : tag);
        }
    }
    return names.join(", ");
};

/**
 * Reads a `/<command>` comment: nothing after the command selects every area; otherwise every
 * name, separated by spaces, commas or both, must be an area, a part or an alias. Names are
 * matched without regard to case, duplicates collapse, and an area named together with one of its
 * own parts keeps only the area. Tags come back in the order of the area list.
 */
export const parseE2eCommand = (
    body: string,
    areas: readonly SelectableArea[],
    command = "e2e"
): E2eCommand => {
    const prefix = `/${command}`;
    const rest = body.startsWith(prefix) ? body.slice(prefix.length) : null;
    // The workflow only starts on `/<command>` alone or followed by a space; anything else is not
    // this command.
    if (rest === null || (rest.length > 0 && !/^\s/.test(rest))) {
        return { ok: false, message: `The comment does not start with ${prefix}.` };
    }

    const names = rest
        .split(/[\s,]+/)
        .filter(name => name.length > 0)
        .map(name => name.toLowerCase());
    if (names.length === 0) {
        return { ok: true, tags: [], label: "all" };
    }

    const selectors = createAreaSelectors(areas);
    const selected = new Set<string>();
    const unknown = new Set<string>();
    let invalid = 0;
    for (const name of names) {
        if (!NAME_PATTERN.test(name)) {
            invalid++;
            continue;
        }
        const selector = selectors.get(name);
        if (!selector) {
            unknown.add(name);
            continue;
        }
        selected.add(selector.tag);
    }

    if (unknown.size > 0 || invalid > 0) {
        const problems: string[] = [];
        if (unknown.size > 0) {
            const list = [...unknown].map(name => `\`${name}\``).join(", ");
            problems.push(`Unknown area: ${list}.`);
        }
        if (invalid > 0) {
            problems.push(
                `${invalid} name(s) not made of a-z, 0-9 and - only, or longer than 64 characters.`
            );
        }
        problems.push(`Valid names: ${describeValidNames(areas)}.`);
        return { ok: false, message: problems.join(" ") };
    }

    const tags: string[] = [];
    for (const area of areas) {
        if (selected.has(area.name)) {
            tags.push(area.name);
            continue;
        }
        for (const part of area.parts || []) {
            const tag = partTag(area, part);
            if (selected.has(tag)) {
                tags.push(tag);
            }
        }
    }

    return { ok: true, tags, label: tags.join(", ") };
};
