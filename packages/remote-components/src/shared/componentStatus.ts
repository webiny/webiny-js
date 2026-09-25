/**
 * A component's bundle state — what decides whether it can be placed on a page.
 *
 * Every transition has exactly one writer, which is the property that makes the value worth reading:
 *
 *   create / Promote                    -> draft, or bundled when Promote bundled it first
 *   bundling succeeds                   -> bundled
 *   bundling fails                      -> failed
 *   update changes `source` or `css`    -> stale, but only from bundled
 *
 * It deliberately does not describe availability. `published` used to be rendered as the Library
 * list's success chip and was never written by anything; publication is a separate axis and, if it
 * becomes real, wants its own field rather than a value here.
 *
 * Staleness is set at the moment the source changes rather than derived by comparing hashes. Deriving
 * it would need a stored hash of the source — `bundledJsSha256` hashes the bundle, not its input —
 * and after the editor was pointed at `bundleRemoteComponent`, `update` is the only writer of source,
 * so there is one place to get it right.
 */
export const COMPONENT_STATUSES = ["draft", "bundled", "stale", "failed"] as const;

export type ComponentStatus = (typeof COMPONENT_STATUSES)[number];

/**
 * `failed` is reachable **only through an explicit re-bundle in the editor**. Promote skips a
 * component whose bundling fails rather than creating it, the same way it skips one that fails
 * validation, because the Library's invariant is that everything in it is placeable — so a failed
 * bundle never enters the Library through that path. It is not dead: do not remove it.
 */
export const FAILED_IS_EDITOR_ONLY = true;

const KNOWN = new Set<string>(COMPONENT_STATUSES);

/**
 * Narrows a stored value to the enum. Entries written before this enum existed carry `"draft"`, and
 * anything unrecognised is treated as `draft` rather than surfaced — the GraphQL field is an enum, so
 * one bad row would otherwise fail the whole query for every component beside it.
 */
export const toComponentStatus = (value: unknown): ComponentStatus =>
    typeof value === "string" && KNOWN.has(value) ? (value as ComponentStatus) : "draft";
