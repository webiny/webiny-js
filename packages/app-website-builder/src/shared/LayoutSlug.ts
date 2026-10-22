/**
 * The slug of a source layout: lowercase letters, numbers and single hyphens between them, e.g. `blog-post`.
 * Code names a layout by it (a CMS model's settings), so it's unique among the tenant's source layouts.
 * Language versions have none: they're named by their source's slug.
 *
 * Kept in step with the API's `LayoutSlug` (`@webiny/api-website-builder`, `domain/layout/LayoutSlug.ts`): the
 * packages can't import each other, so change both together. Only `fromInput` and `complete`, for typing a
 * slug into a form, are admin-only.
 */
export class LayoutSlug {
    static readonly PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    // The slug of a title with nothing to make one from.
    static readonly FALLBACK = "layout";

    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    // A slug as sent or stored. Check it with `validate()`.
    static from(value: unknown): LayoutSlug {
        return new LayoutSlug(typeof value === "string" ? value.trim() : String(value ?? ""));
    }

    // A valid slug made from a title: "Blog Post (EN)" -> "blog-post-en".
    static fromTitle(title: string): LayoutSlug {
        const value = LayoutSlug.slugify(title).replace(/-+$/g, "");
        return new LayoutSlug(value || LayoutSlug.FALLBACK);
    }

    /**
     * A slug as it's typed: slugified, but a trailing hyphen is kept, so the next word can be typed after it;
     * `complete()` drops it.
     */
    static fromInput(value: unknown): LayoutSlug {
        return new LayoutSlug(LayoutSlug.slugify(String(value ?? "")));
    }

    // Lowercased, accents dropped, anything else replaced by a hyphen, leading hyphens dropped.
    private static slugify(value: string): string {
        return value
            .normalize("NFKD")
            .replace(/[̀-ͯ]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+/g, "");
    }

    // The typed slug without a trailing hyphen, as it's saved.
    complete(): LayoutSlug {
        return new LayoutSlug(this.value.replace(/-+$/g, ""));
    }

    /**
     * The `index`th slug to try when this one is taken: `blog`, `blog-2`, `blog-3`, ...
     */
    candidate(index: number): LayoutSlug {
        return index <= 1 ? this : new LayoutSlug(`${this.value}-${index}`);
    }

    // The slug of a copy: `blog` -> `blog-copy`.
    copy(): LayoutSlug {
        return new LayoutSlug(`${this.value}-copy`);
    }

    /**
     * The reason the slug is invalid, or `null`.
     */
    validate(): string | null {
        if (!this.value) {
            return "`properties.slug` must be a non-empty string.";
        }
        if (!LayoutSlug.PATTERN.test(this.value)) {
            return "`properties.slug` can only contain lowercase letters, numbers and hyphens between them.";
        }
        return null;
    }

    equals(other: LayoutSlug): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
