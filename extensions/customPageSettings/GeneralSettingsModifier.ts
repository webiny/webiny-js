import { PageSettingsGroupModifier } from "webiny/admin/website-builder/page/editor";

class GeneralSettingsModifierImpl implements PageSettingsGroupModifier.Interface {
    group = "general";

    modifyForm(form: PageSettingsGroupModifier.FormBuilder): void {
        form.fields(fields => ({
            expirationDate: fields
                .datetime()
                .label("Expiration date")
                .renderer("dateTimeInput", { type: "dateTime" })
        }));

        form.layout(layout => [layout.row("expirationDate").after("snippet")]);
    }

    mapToForm(doc: PageSettingsGroupModifier.PageDocument): Record<string, any> {
        return {
            expirationDate: doc.extensions?.expirationDate ?? null
        };
    }

    mapFromForm(formData: Record<string, any>, doc: PageSettingsGroupModifier.PageDocument): void {
        doc.extensions.expirationDate = formData.expirationDate;
    }
}

export const GeneralSettingsModifier = PageSettingsGroupModifier.createImplementation({
    implementation: GeneralSettingsModifierImpl,
    dependencies: []
});
