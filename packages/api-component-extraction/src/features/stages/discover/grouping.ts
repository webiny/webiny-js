/** A URL chosen for the run, with the path-prefix group it was chosen from. */
export interface SampledUrl {
    url: string;
    group: string;
}

/** The path-prefix group for a URL: its first path segment, or "root" for "/". */
export const pathGroup = (url: string): string => {
    try {
        const segment = new URL(url).pathname.split("/").filter(Boolean)[0];
        return segment ? segment.toLowerCase() : "root";
    } catch {
        return "root";
    }
};

/** Group URLs by path prefix, preserving first-seen order within each group. */
export const groupByPath = (urls: string[]): Map<string, string[]> => {
    const groups = new Map<string, string[]>();
    for (const url of urls) {
        const group = pathGroup(url);
        const list = groups.get(group) ?? [];
        list.push(url);
        groups.set(group, list);
    }
    return groups;
};

/** A segment that identifies an item rather than naming a page: a number, a year, a date. */
const IDENTIFIER_SEGMENT = /^(\d+|\d{4}-\d{2}(-\d{2})?)$/;

const segmentsOf = (url: string): string[] => {
    try {
        return new URL(url).pathname.split("/").filter(Boolean);
    } catch {
        return [];
    }
};

/**
 * The template a URL is an instance of: its path with identifier segments replaced.
 *
 * `/blog/page/2` and `/blog/page/7` are one template, and so are `/news/2024/05` and `/news/2023/11`.
 * A custom CMS can produce hundreds of those, all rendering the same layout with different rows in it,
 * and they are worth exactly one page of the cap between them.
 */
const templateKey = (url: string): string =>
    `/${segmentsOf(url)
        .map(segment => (IDENTIFIER_SEGMENT.test(segment) ? "#" : segment.toLowerCase()))
        .join("/")}`;

/**
 * Sample up to `cap` URLs, preferring path diversity over depth.
 *
 * Three rules, in order of how much they matter. Groups are visited round-robin, so a site with 200
 * blog posts and one pricing page still surfaces the pricing page. Within a group, shallower paths come
 * first, because a page's distance from the home page is a decent proxy for how much design it carries.
 * And a template only claims one slot until every other template has had one, so a paginated archive
 * cannot spend the budget on forty copies of itself.
 *
 * The cap is still filled: once every distinct template is represented, a second pass takes further
 * instances rather than returning short.
 */
export const sampleAcrossGroups = (urls: string[], cap: number): SampledUrl[] => {
    if (cap <= 0) {
        return [];
    }

    const distinct = [...new Set(urls)];
    const templates = new Map(distinct.map(url => [url, templateKey(url)]));
    const depths = new Map(distinct.map(url => [url, segmentsOf(url).length]));

    const groups = groupByPath(distinct);
    const order = [...groups.keys()];
    const candidates = new Map(
        [...groups.entries()].map(([group, list]) => [
            group,
            // Stable: equal depths keep the order the source listed them in.
            [...list].sort((a, b) => depths.get(a)! - depths.get(b)!)
        ])
    );

    const sampled: SampledUrl[] = [];
    const taken = new Set<string>();
    const represented = new Set<string>();

    const pass = (freshTemplatesOnly: boolean): void => {
        let advanced = true;
        while (advanced && sampled.length < cap) {
            advanced = false;
            for (const group of order) {
                if (sampled.length >= cap) {
                    break;
                }
                const next = candidates
                    .get(group)!
                    .find(
                        url =>
                            !taken.has(url) &&
                            (!freshTemplatesOnly || !represented.has(templates.get(url)!))
                    );
                if (!next) {
                    continue;
                }
                taken.add(next);
                represented.add(templates.get(next)!);
                sampled.push({ url: next, group });
                advanced = true;
            }
        }
    };

    pass(true);
    pass(false);

    return sampled;
};
