import { PageSettingsGroupModifier } from "../PageSettings/abstractions.js";
import { LayoutsRepository, ListLayoutsUseCase } from "~/features/layouts/index.js";
import { LayoutIdentity } from "~/domain/Layout/index.js";

/**
 * Pick the layout the page is rendered in: a published source layout. Without one, the frontend renders
 * the page in its own layout.
 */
class PageLayoutSettingsImpl implements PageSettingsGroupModifier.Interface {
    group = "general";

    constructor(
        private listLayouts: ListLayoutsUseCase.Interface,
        private layouts: LayoutsRepository.Interface
    ) {}

    modifyForm(form: PageSettingsGroupModifier.FormBuilder): void {
        void this.listLayouts.execute().catch(() => {
            // Without the layouts, there's nothing to pick from.
        });

        form.fields(fields => ({
            layout: fields
                .text()
                .label("Layout")
                .description(
                    "Rendered around the page content, in the page's language if the layout has a published version in it. Without one, the website's own layout is used. Build and publish layouts in Website Builder > Layouts."
                )
                .options(() =>
                    this.layouts.layouts
                        .map(layout => ({ layout, identity: LayoutIdentity.from(layout) }))
                        .filter(({ identity }) => identity.canBePicked())
                        .map(({ layout, identity }) => ({
                            label: identity.title(),
                            value: layout.entryId
                        }))
                )
        }));

        form.layout(layout => [layout.row("layout")]);
    }

    mapToForm(document: PageSettingsGroupModifier.PageDocument) {
        return { layout: document.properties?.layout ?? null };
    }

    mapFromForm(formData: Record<string, any>, document: PageSettingsGroupModifier.PageDocument) {
        document.properties.layout = formData.layout || null;
    }
}

export const PageLayoutSettings = PageSettingsGroupModifier.createImplementation({
    implementation: PageLayoutSettingsImpl,
    dependencies: [ListLayoutsUseCase, LayoutsRepository]
});
