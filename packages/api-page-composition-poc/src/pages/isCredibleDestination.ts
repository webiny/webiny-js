/** What a destination is judged against: what this section actually linked to, and whose site it is. */
export interface DestinationContext {
    /** Every href captured from this section, absolute as the browser resolved it. */
    captured: ReadonlySet<string>;
    sourceHost: string;
}

const PLACEHOLDER_DESTINATIONS = new Set(["", "#", "/", "javascript:void(0)"]);

/**
 * A destination that openly goes nowhere, as opposed to one the model invented.
 *
 * Both are dropped, but only one is a finding: `#` does nothing and misleads nobody, while
 * `/privacy-policy` looks live and 404s. Counting them together would inflate the invented count
 * with inputs the model simply left blank.
 */
export const isPlaceholderDestination = (destination: string): boolean =>
    PLACEHOLDER_DESTINATIONS.has(destination.trim());

/**
 * Would this destination actually go somewhere on the migrated site?
 *
 * Three ways to be credible: it is one of the destinations captured from this section; it is
 * absolute and points at another host, so it still resolves; or it is not an http(s) scheme at all
 * (`mailto:`, `tel:`), which cannot 404.
 *
 * Everything else is a destination the model invented. A relative one is the worst of them: across
 * the five customer sites every invented path was relative and every captured href was absolute
 * without exception, so "relative and not captured" is the discriminator, not a heuristic. `/demo`
 * and `/privacy-policy` look live and return a 404; `#` at least does nothing. An absolute URL on
 * the SOURCE host that was never captured is the same problem wearing a domain.
 *
 * One definition, used by every path that can put a destination on a page. It used to live inside
 * the composite-list branch, which is exactly why the invented paths survived on scalars and on
 * single composites — the rule existed and simply was not asked.
 */
export const isCredibleDestination = (
    destination: string,
    context: DestinationContext
): boolean => {
    const trimmed = destination.trim();

    if (!trimmed || PLACEHOLDER_DESTINATIONS.has(trimmed)) {
        return false;
    }
    if (context.captured.has(trimmed)) {
        return true;
    }

    try {
        const url = new URL(trimmed);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return true;
        }
        return url.host !== "" && url.host !== context.sourceHost;
    } catch {
        // Not absolute, and not captured: a relative path the model made up.
        return false;
    }
};
