/**
 * robots.txt, per RFC 9309 — see the design brief, section 10.6.
 *
 * We check it because extraction fetches somebody's site from Webiny's infrastructure, and a
 * customer pointing us at a URL is not the site owner's consent. It is also self-interested: sites
 * that publish crawl rules tend to enforce them, and a blocked fetch wastes the whole task.
 *
 * Parsing is deliberately whole-file rather than "find the first matching group". A robots.txt can
 * name our agent halfway down, after the wildcard group, and honouring only the first match would
 * apply rules meant for someone else.
 */

export interface RobotsRule {
    type: "allow" | "disallow";
    /** The raw path pattern, which may contain `*` and a trailing `$`. */
    pattern: string;
}

export interface RobotsGroup {
    /** Lower-cased user-agent tokens this group applies to. */
    agents: string[];
    rules: RobotsRule[];
    crawlDelayMs?: number;
}

export interface RobotsTxt {
    groups: RobotsGroup[];
}

/**
 * Cap on an honoured `Crawl-delay`.
 *
 * `Crawl-delay` is not in RFC 9309 and is written for bulk crawlers fetching thousands of pages;
 * some sites set it to hours. We fetch at most a handful, so beyond this cap we stop waiting rather
 * than spend the task's whole budget being polite to a directive aimed at somebody else.
 */
export const MAX_CRAWL_DELAY_MS = 5000;

const AGENT_DIRECTIVE = "user-agent";

export const parseRobotsTxt = (text: string): RobotsTxt => {
    const groups: RobotsGroup[] = [];
    let current: RobotsGroup | undefined;
    // Consecutive `User-agent` lines share one group; a rule line ends the run and starts a new
    // group on the next agent line.
    let acceptingAgents = false;

    for (const rawLine of text.split(/\r?\n/)) {
        // Comments may be inline, not just whole-line.
        const line = rawLine.split("#")[0].trim();
        if (line === "") {
            continue;
        }

        const separator = line.indexOf(":");
        if (separator === -1) {
            continue;
        }

        const directive = line.slice(0, separator).trim().toLowerCase();
        const value = line.slice(separator + 1).trim();

        if (directive === AGENT_DIRECTIVE) {
            if (!current || !acceptingAgents) {
                current = { agents: [], rules: [] };
                groups.push(current);
                acceptingAgents = true;
            }
            current.agents.push(value.toLowerCase());
            continue;
        }

        if (!current) {
            // Rules before any `User-agent` line have no owner; ignore them rather than guess.
            continue;
        }

        acceptingAgents = false;

        if (directive === "allow" || directive === "disallow") {
            // An empty `Disallow:` means "nothing is disallowed" and carries no pattern, so it is
            // dropped here rather than stored as a rule matching everything.
            if (value !== "") {
                current.rules.push({ type: directive, pattern: value });
            }
            continue;
        }

        if (directive === "crawl-delay") {
            const seconds = Number.parseFloat(value);
            if (Number.isFinite(seconds) && seconds > 0) {
                current.crawlDelayMs = Math.min(seconds * 1000, MAX_CRAWL_DELAY_MS);
            }
        }
    }

    return { groups };
};

/**
 * Picks the group that applies to us.
 *
 * An exact agent match wins over the wildcard however far down the file it appears, which is the
 * whole point of naming a crawler. Groups naming the same agent twice are merged, because a split
 * group is a formatting choice and not an instruction to ignore half the rules.
 */
export const selectRobotsGroup = (
    robots: RobotsTxt,
    userAgentToken: string
): RobotsGroup | undefined => {
    const token = userAgentToken.toLowerCase();

    const merge = (matching: RobotsGroup[]): RobotsGroup | undefined => {
        if (matching.length === 0) {
            return undefined;
        }

        return matching.reduce<RobotsGroup>(
            (merged, group) => ({
                agents: [...merged.agents, ...group.agents],
                rules: [...merged.rules, ...group.rules],
                // The strictest delay any matching group asks for.
                crawlDelayMs:
                    merged.crawlDelayMs === undefined
                        ? group.crawlDelayMs
                        : group.crawlDelayMs === undefined
                          ? merged.crawlDelayMs
                          : Math.max(merged.crawlDelayMs, group.crawlDelayMs)
            }),
            { agents: [], rules: [] }
        );
    };

    const named = robots.groups.filter(group => group.agents.includes(token));
    return merge(named) ?? merge(robots.groups.filter(group => group.agents.includes("*")));
};

const toRegExp = (pattern: string): RegExp => {
    const anchored = pattern.endsWith("$");
    const body = anchored ? pattern.slice(0, -1) : pattern;

    const escaped = body
        .split("*")
        .map(part => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*");

    return new RegExp(`^${escaped}${anchored ? "$" : ""}`);
};

/**
 * Whether a path may be fetched.
 *
 * RFC 9309: the longest matching pattern wins, and on an equal-length tie `Allow` wins. Ties are
 * common in practice — `Disallow: /search` alongside `Allow: /search` — and resolving them the other
 * way would make a deliberate carve-out unreachable.
 */
export const isPathAllowed = (group: RobotsGroup | undefined, path: string): boolean => {
    if (!group) {
        return true;
    }

    let decision: RobotsRule["type"] = "allow";
    let bestLength = -1;

    for (const rule of group.rules) {
        if (!toRegExp(rule.pattern).test(path)) {
            continue;
        }

        const length = rule.pattern.length;
        if (length > bestLength || (length === bestLength && rule.type === "allow")) {
            decision = rule.type;
            bestLength = length;
        }
    }

    return decision === "allow";
};

export interface RobotsPolicy {
    isAllowed(url: string): boolean;
    readonly crawlDelayMs: number;
}

/**
 * The crawl-facing view of a robots.txt.
 *
 * A missing, empty or unparseable file yields a permissive policy. That is the standard's own
 * position — absence of rules is not a prohibition — and the alternative would make every site
 * without a robots.txt un-extractable.
 */
export const createRobotsPolicy = (
    text: string | undefined,
    userAgentToken: string
): RobotsPolicy => {
    const group = text ? selectRobotsGroup(parseRobotsTxt(text), userAgentToken) : undefined;

    return {
        isAllowed(url: string) {
            let path: string;
            try {
                const parsed = new URL(url);
                path = `${parsed.pathname}${parsed.search}`;
            } catch {
                // Not a URL we can reason about; let the fetch itself fail with a real error.
                return true;
            }

            return isPathAllowed(group, path);
        },
        crawlDelayMs: group?.crawlDelayMs ?? 0
    };
};
