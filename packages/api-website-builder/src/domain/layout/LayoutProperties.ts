import type { CmsEntryWbLayoutProperties } from "./abstractions.js";
import { LayoutSlug } from "./LayoutSlug.js";
import { GlobalComponentLanguage } from "~/domain/globals/GlobalComponentLanguage.js";

/**
 * A layout's `properties` as sent to create or update it: its title, its slug, its language, and, on a language
 * version, its source layout. Checked by `validate()`.
 */
export class LayoutProperties {
    private readonly properties: CmsEntryWbLayoutProperties | null;
    private readonly error: string | null;

    private constructor(properties: CmsEntryWbLayoutProperties | null, error: string | null) {
        this.properties = properties;
        this.error = error;
    }

    /**
     * A new layout's properties. A layout created here is never a language version, so a sent
     * `sourceLayout` is dropped. A slug that isn't sent is left out: see `slug()`.
     */
    static create(input: unknown): LayoutProperties {
        if (!LayoutProperties.isPlainObject(input)) {
            return LayoutProperties.invalid("`properties` must be an object.");
        }

        const { sourceLayout: _, slug: sentSlug, ...rest } = input;
        const title = typeof rest.title === "string" ? rest.title.trim() : "";
        if (!title) {
            return LayoutProperties.invalid("`properties.title` must be a non-empty string.");
        }

        if (LayoutProperties.isEmpty(sentSlug)) {
            return LayoutProperties.withLanguage({ ...rest, title });
        }

        const slug = LayoutSlug.from(sentSlug);
        const slugError = slug.validate();
        if (slugError) {
            return LayoutProperties.invalid(slugError);
        }

        return LayoutProperties.withLanguage({ ...rest, title, slug: slug.toString() });
    }

    /**
     * A layout's properties updated with the sent ones. An empty title keeps the stored one: a layout always
     * has a title. A slug that isn't sent keeps the stored one, and a stored slug can be changed but not removed.
     * A language version stays the version of its source, in its language, and has no slug of its own.
     */
    static update(original: CmsEntryWbLayoutProperties, input: unknown): LayoutProperties {
        if (!LayoutProperties.isPlainObject(input)) {
            return LayoutProperties.invalid("`properties` must be an object.");
        }

        if (input.title !== undefined && input.title !== null && typeof input.title !== "string") {
            return LayoutProperties.invalid("`properties.title` must be a string.");
        }

        const title = typeof input.title === "string" ? input.title.trim() : "";
        const properties: CmsEntryWbLayoutProperties = {
            ...original,
            ...input,
            title: title || original.title
        };

        if (original.sourceLayout) {
            const { slug: _, ...version } = properties;
            return new LayoutProperties(
                {
                    ...version,
                    sourceLayout: original.sourceLayout,
                    language: original.language
                },
                null
            );
        }

        const { sourceLayout: _, slug: __, ...rest } = properties;
        const source = rest as CmsEntryWbLayoutProperties;

        if (LayoutProperties.isEmpty(input.slug)) {
            if (input.slug !== undefined && original.slug) {
                return LayoutProperties.invalid("`properties.slug` can be changed, not removed.");
            }
            return LayoutProperties.withLanguage(
                original.slug ? { ...source, slug: original.slug } : source
            );
        }

        const slug = LayoutSlug.from(input.slug);
        const slugError = slug.validate();
        if (slugError) {
            return LayoutProperties.invalid(slugError);
        }

        return LayoutProperties.withLanguage({ ...source, slug: slug.toString() });
    }

    // A layout without a language is stored without one; a sent language must be a language code.
    private static withLanguage(properties: CmsEntryWbLayoutProperties): LayoutProperties {
        const { language, ...rest } = properties;
        if (language === undefined || language === null) {
            return new LayoutProperties(rest as CmsEntryWbLayoutProperties, null);
        }

        if (GlobalComponentLanguage.validate(language)) {
            return LayoutProperties.invalid("`properties.language` must be a language code.");
        }

        return new LayoutProperties(properties, null);
    }

    private static invalid(error: string): LayoutProperties {
        return new LayoutProperties(null, error);
    }

    private static isPlainObject(value: unknown): value is Record<string, any> {
        return typeof value === "object" && value !== null && !Array.isArray(value);
    }

    private static isEmpty(value: unknown): boolean {
        return value === undefined || value === null || value === "";
    }

    /**
     * The reason the properties are invalid, or `null`.
     */
    validate(): string | null {
        return this.error;
    }

    // The layout's slug, or `null`: a new layout sent without one, a language version, or an older layout.
    slug(): LayoutSlug | null {
        const slug = this.toJSON().slug;
        return slug ? LayoutSlug.from(slug) : null;
    }

    // The properties with this slug.
    withSlug(slug: LayoutSlug): LayoutProperties {
        return new LayoutProperties({ ...this.toJSON(), slug: slug.toString() }, null);
    }

    toJSON(): CmsEntryWbLayoutProperties {
        if (!this.properties) {
            throw new Error(`Invalid layout properties: ${this.error}`);
        }
        return this.properties;
    }
}
