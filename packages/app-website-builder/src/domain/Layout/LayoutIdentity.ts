/**
 * The shape of a layout this reads: a listed layout, the layout editor's document, or the layout a page
 * is rendered in. Each carries only some of it.
 */
interface LayoutIdentityData {
    id?: string;
    entryId?: string;
    status?: string;
    locked?: boolean;
    live?: { version: number } | null;
    properties?: {
        title?: string | null;
        sourceLayout?: string | null;
        [key: string]: any;
    } | null;
}

/**
 * What a layout is: a source layout or a language version of one, whether it can still change, and
 * whether pages can pick it.
 */
export class LayoutIdentity {
    // The title of a layout saved without one.
    static readonly UNTITLED = "Untitled";

    private readonly layout: LayoutIdentityData;

    private constructor(layout: LayoutIdentityData) {
        this.layout = layout;
    }

    static from(layout: LayoutIdentityData): LayoutIdentity {
        return new LayoutIdentity(layout);
    }

    // A source layout has no `properties.sourceLayout`; a language version names its source there.
    isSource(): boolean {
        return !this.layout.properties?.sourceLayout;
    }

    // Whether this is a language version of the source layout with the given entry id.
    isVersionOf(sourceEntryId: string): boolean {
        return this.layout.properties?.sourceLayout === sourceEntryId;
    }

    // A published or locked revision can't change: it opens read-only, like a published page.
    isReadOnly(): boolean {
        return Boolean(this.layout.locked) || this.layout.status !== "draft";
    }

    // Pages pick a published source layout. It's rendered in its published version in the page's language, if any.
    canBePicked(): boolean {
        return this.isSource() && Boolean(this.layout.live);
    }

    // The entry id of the source layout this belongs to: pages reference a layout by it.
    sourceId(): string | null {
        return (
            this.layout.properties?.sourceLayout || this.layout.entryId || this.layout.id || null
        );
    }

    title(): string {
        return this.layout.properties?.title || LayoutIdentity.UNTITLED;
    }
}
