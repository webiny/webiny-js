import { z } from "zod";
import { PageSettingsGroup } from "../abstractions.js";

const PATHNAME_REGEX = new RegExp(
    `^\\/(?:[a-zA-Z0-9._~:@!$&'()*+,;=%/-])*(?:\\?[a-zA-Z0-9._~:@!$&'()*+,;=?/%#[\\]-]*)?(?:#[a-zA-Z0-9._~:@!$&'()*+,;=?/%#[\\]-]*)?$`
);

class SeoSettingsGroupImpl implements PageSettingsGroup.Interface {
    name = "seo";
    label = "SEO";
    description = "Optimize how this page appears in search engine results.";
    icon = { type: "icon", name: "fas/search" };

    buildForm(form: PageSettingsGroup.FormBuilder): void {
        form.fields(fields => ({
            title: fields.text().label("Title").description("SEO title"),
            description: fields
                .text()
                .label("Description")
                .description("SEO description")
                .renderer("textarea"),
            metaTags: fields
                .object()
                .label("Meta Tags")
                .description("Add SEO tags")
                .renderer("keyValueTags")
                .fields(f => ({
                    name: f.text().placeholder("Name"),
                    content: f.text().placeholder("Content")
                }))
                .list(),
            canonicalUrl: fields
                .text()
                .label("Canonical URL")
                .description("The canonical URL for this page")
                .schema(
                    z
                        .string()
                        .optional()
                        .refine(
                            val => !val || PATHNAME_REGEX.test(val),
                            "Enter a valid pathname, e.g.: /path/to/page?query=value"
                        )
                ),
            noIndex: fields
                .boolean()
                .label("No Index")
                .description("Whether this page should be indexed by search engines")
                .defaultValue(false)
                .renderer("switch"),
            noFollow: fields
                .boolean()
                .label("No Follow")
                .description("Whether search engines should follow links on this page")
                .defaultValue(false)
                .renderer("switch")
        }));

        form.layout(layout => [
            layout.row("title"),
            layout.row("description"),
            layout.row("metaTags"),
            layout.row("canonicalUrl"),
            layout.row("noIndex"),
            layout.row("noFollow")
        ]);
    }

    mapToForm(doc: PageSettingsGroup.PageDocument): Record<string, any> {
        const seo = doc.properties?.seo ?? {};
        return {
            title: seo.title,
            description: seo.description,
            metaTags: seo.metaTags,
            canonicalUrl: seo.canonicalUrl,
            noIndex: seo.noIndex ?? false,
            noFollow: seo.noFollow ?? false
        };
    }

    mapFromForm(formData: Record<string, any>, doc: PageSettingsGroup.PageDocument): void {
        doc.properties.seo = doc.properties.seo ?? {};
        doc.properties.seo.title = formData.title;
        doc.properties.seo.description = formData.description;
        doc.properties.seo.metaTags = formData.metaTags;
        doc.properties.seo.canonicalUrl = formData.canonicalUrl;
        doc.properties.seo.noIndex = formData.noIndex;
        doc.properties.seo.noFollow = formData.noFollow;
    }
}

export const SeoSettingsGroup = PageSettingsGroup.createImplementation({
    implementation: SeoSettingsGroupImpl,
    dependencies: []
});
