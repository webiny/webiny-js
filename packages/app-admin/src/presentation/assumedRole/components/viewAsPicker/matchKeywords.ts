/*
 * Plain substring matching over label, description and type, as the design specifies. cmdk's default
 * is fuzzy and also scores the item's value, which here ends in a database id, so "read" matched
 * every role whose id happened to contain those letters in order.
 */
export function matchKeywords(_value: string, search: string, keywords?: string[]): number {
    const haystack = (keywords ?? []).join(" ").toLowerCase();
    const needle = search.trim().toLowerCase();
    return haystack.includes(needle) ? 1 : 0;
}
