import type { DiscoveredUrl } from "~/domain/artifacts.js";

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

/**
 * Sample up to `cap` URLs spread across path groups, round-robin, rather than taking the first N.
 *
 * A site with 200 blog posts and one pricing page should still surface the pricing page — taking the
 * first N would drown it. Groups are visited in first-seen order, one URL each per round, until the cap
 * is reached or every group is exhausted.
 */
export const sampleAcrossGroups = (urls: string[], cap: number): DiscoveredUrl[] => {
    if (cap <= 0) {
        return [];
    }
    const groups = groupByPath([...new Set(urls)]);
    const order = [...groups.keys()];
    const cursors = new Map<string, number>();
    const sampled: DiscoveredUrl[] = [];

    while (sampled.length < cap) {
        let advanced = false;
        for (const group of order) {
            if (sampled.length >= cap) {
                break;
            }
            const list = groups.get(group)!;
            const cursor = cursors.get(group) ?? 0;
            if (cursor < list.length) {
                cursors.set(group, cursor + 1);
                sampled.push({ url: list[cursor], group });
                advanced = true;
            }
        }
        if (!advanced) {
            break;
        }
    }
    return sampled;
};
