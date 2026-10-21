/**
 * The slug of a source layout: lowercase letters, numbers and single hyphens between them, e.g. `blog-post`.
 * Code names a layout by it. Mirrors the API-side `LayoutSlug`, tailored for form input.
 */
export class LayoutSlug {
    static readonly PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    // The slug of a title with nothing to make one from.
    static readonly FALLBACK = "layout";

    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    // A slug made from a title, as the API makes one: "Blog Post (EN)" -> "blog-post-en".
    static fromTitle(title: string): LayoutSlug {
        const value = LayoutSlug.clean(title).replace(/-+$/g, "");
        return new LayoutSlug(value || LayoutSlug.FALLBACK);
    }

    /**
     * A slug as it's typed: lowercased, with anything else replaced by a hyphen. A trailing hyphen is kept, so
     * the next word can be typed after it; `complete()` drops it.
     */
    static fromInput(value: unknown): LayoutSlug {
        return new LayoutSlug(LayoutSlug.clean(String(value ?? "")));
    }

    private static clean(value: string): string {
        return value
            .normalize("NFKD")
            .replace(/[̀-ͯ]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+/g, "");
    }

    // The slug without a trailing hyphen, as it's saved.
    complete(): LayoutSlug {
        return new LayoutSlug(this.value.replace(/-+$/g, ""));
    }

    isValid(): boolean {
        return LayoutSlug.PATTERN.test(this.value);
    }

    toString(): string {
        return this.value;
    }
}
