import { ModelFactory } from "webiny/api/cms/model";

export const SETTINGS_MODEL_ID = "storeSettings";

class SettingsModelImpl implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .public({
                    modelId: SETTINGS_MODEL_ID,
                    name: "Store Settings",
                    group: "ungrouped"
                })
                .description("Settings for our e-commerce store")
                .fields(fields => ({
                    settings: fields
                        .uiTabs()
                        .label("My Tabs")
                        .tab("general", {
                            name: "General",
                            fields: f => ({
                                title: f.text().label("Title"),
                                slug: f.text().label("Slug")
                            })
                        })
                        .tab("seo", {
                            name: "SEO",
                            fields: f => ({
                                metaTitle: f.text().label("Meta Title")
                            })
                        })
                }))
                .layout([["settings"]])
                .singularApiName("StoreSettings")
                .pluralApiName("StoreSettings")
        ];
    }
}

export default ModelFactory.createImplementation({
    implementation: SettingsModelImpl,
    dependencies: []
});
