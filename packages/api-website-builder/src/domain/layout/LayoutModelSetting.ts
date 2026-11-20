import type { CmsModel } from "@webiny/api-headless-cms/types";

declare module "@webiny/api-headless-cms/features/modelBuilder/abstractions.js" {
    interface IModelSettings {
        /**
         * The slug of the Website Builder layout the model's entries render in, on the live site and in the
         * entry editor's live preview: `.settings({ previewPath: "/articles/{slug}", layout: "blog" })`.
         * Unpublishing or deleting that layout is refused while a model names it.
         */
        layout?: string;
    }
}

/**
 * A CMS model's `layout` setting: the slug of the layout its entries render in, or none.
 */
export class LayoutModelSetting {
    private readonly slug: string | null;

    private constructor(slug: string | null) {
        this.slug = slug;
    }

    static from(model: Pick<CmsModel, "settings">): LayoutModelSetting {
        const value = model.settings?.layout;
        const slug = typeof value === "string" ? value.trim() : "";
        return new LayoutModelSetting(slug || null);
    }

    getSlug(): string | null {
        return this.slug;
    }

    names(slug: string | null | undefined): boolean {
        return this.slug !== null && this.slug === slug;
    }
}
