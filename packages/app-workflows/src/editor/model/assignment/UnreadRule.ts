/*
 * A stored `rules` entry that is not an object. The editor cannot show it, so it is kept with its
 * position in the stored list and written back unchanged.
 */
export interface UnreadRule {
    index: number;
    value: unknown;
}
