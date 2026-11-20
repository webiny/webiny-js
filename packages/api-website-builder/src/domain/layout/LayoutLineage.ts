import type { Layout } from "./abstractions.js";

/**
 * Whether a layout is a source layout or a language version of one. A language version belongs to its source:
 * it has no slug of its own, is used by the pages that reference its source, and goes when its source does.
 */
export class LayoutLineage {
    private readonly entryId: string;
    private readonly source: string | null;

    private constructor(entryId: string, source: string | null) {
        this.entryId = entryId;
        this.source = source;
    }

    static from(layout: Pick<Layout, "entryId" | "properties">): LayoutLineage {
        return new LayoutLineage(layout.entryId, layout.properties.sourceLayout || null);
    }

    isSource(): boolean {
        return this.source === null;
    }

    isLanguageVersion(): boolean {
        return this.source !== null;
    }

    /**
     * The entry id pages reference this layout by: a source's own, or a language version's source.
     */
    sourceEntryId(): string {
        return this.source ?? this.entryId;
    }

    // Whether this layout is a language version of the given source layout.
    isVersionOf(source: Pick<Layout, "entryId">): boolean {
        return this.source === source.entryId;
    }
}
