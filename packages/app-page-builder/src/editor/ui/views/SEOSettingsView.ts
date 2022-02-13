import trim from "lodash/trim";
import { InputElement } from "@webiny/app-admin/ui/elements/form/InputElement";
import { PageSettingsFormView } from "~/editor/ui/views/PageSettingsView/PageSettingsFormView";
import { validation } from "@webiny/validation";
import { SmallButtonElement } from "@webiny/app-admin/ui/elements/SmallButtonElement";
import { TypographyElement } from "@webiny/app-admin/ui/elements/TypographyElement";
import { LabelElement } from "@webiny/app-admin/ui/elements/LabelElement";
import { ButtonElement } from "@webiny/app-admin/ui/elements/ButtonElement";
import { DynamicFieldsetElement } from "@webiny/app-admin/ui/elements/form/DynamicFieldsetElement";
import { ButtonGroupElement } from "@webiny/app-admin/ui/elements/ButtonGroupElement";

export class SEOSettingsView extends PageSettingsFormView {
    public constructor() {
        super("SEOSettingsView");

        this.setTitle("SEO Media");

        this.addField(
            new InputElement("title", {
                name: "settings.seo.title",
                label: "Title",
                description: "SEO title."
            })
        );

        this.addField(
            new InputElement("description", {
                name: "settings.seo.description",
                label: "Description",
                description: `SEO description.`
            })
        );

        const metaTags = new DynamicFieldsetElement("metaTags", { name: "settings.seo.meta" });

        const header = new TypographyElement("metaTags.header", {
            typography: "button"
        });
        header.addElement(new LabelElement("metaTags.header.label", { text: "Meta tags" }));
        metaTags.setHeaderElement(header);

        metaTags.setCreateEmptyElement(({ actions }) => {
            const emptyElement = new TypographyElement("metaTags.empty", { typography: "button" });
            emptyElement.addElement(
                new LabelElement("metaTags.empty.label", { text: "To add other meta tags, click " })
            );
            emptyElement.addElement(
                new ButtonElement("metaTags.empty.buttonCreate", {
                    label: "Add meta tag",
                    type: "primary",
                    onClick: actions.add()
                })
            );
            return emptyElement;
        });

        metaTags.setCreateRowElement(({ row, actions, index }) => {
            const nameElement = row.addElement(
                new InputElement(`metaTags.${index}.name`, {
                    name: `settings.seo.meta.${index}.name`,
                    label: "Name",
                    validators: () => validation.create("required"),
                    beforeChange: (tag, cb) => cb(trim(tag))
                })
            );
            const contentElement = new InputElement(`metaTags.${index}.content`, {
                name: `settings.seo.meta.${index}.content`,
                label: "Content",
                validators: () => validation.create("required"),
                beforeChange: (tag, cb) => cb(trim(tag))
            });

            contentElement.moveAfter(nameElement);

            const buttons = new ButtonGroupElement(`metaTags.${index}.buttons`);
            buttons.addElement(
                new SmallButtonElement(`metaTags.${index}.buttonAdd`, {
                    type: "primary",
                    label: "+",
                    onClick: actions.add(index)
                })
            );
            buttons.addElement(
                new SmallButtonElement(`metaTags.${index}.buttonRemove`, {
                    type: "secondary",
                    label: "-",
                    onClick: actions.remove(index)
                })
            );

            buttons.moveAfter(contentElement);

            return row;
        });

        this.addField(metaTags);

        this.applyPlugins(SEOSettingsView);
    }
}
