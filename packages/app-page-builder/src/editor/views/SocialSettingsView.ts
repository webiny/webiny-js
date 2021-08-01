import trim from "lodash/trim";
import { InputElement } from "@webiny/app-admin/elements/form/InputElement";
import { PageSettingsFormView } from "~/editor/views/PageSettingsView/PageSettingsFormView";
import { FileManagerElement } from "@webiny/app-admin/elements/form/FileManagerElement";
import { validation } from "@webiny/validation";
import { SmallButtonElement } from "@webiny/app-admin/elements/SmallButtonElement";
import { TypographyElement } from "@webiny/app-admin/elements/TypographyElement";
import { LabelElement } from "@webiny/app-admin/elements/LabelElement";
import { ButtonElement } from "@webiny/app-admin/elements/ButtonElement";
import { DynamicFieldsetElement } from "@webiny/app-admin/elements/form/DynamicFieldsetElement";
import { ButtonGroupElement } from "@webiny/app-admin/elements/ButtonGroupElement";

export class SocialSettingsView extends PageSettingsFormView {
    constructor() {
        super("SocialSettingsView");

        this.setTitle("Social Media");

        this.addField(
            new InputElement("title", {
                name: "settings.social.title",
                label: "Title (leave blank to use your page title)",
                description: "Social media title (og:title)."
            })
        );

        this.addField(
            new InputElement("description", {
                name: "settings.social.description",
                label: "Description (leave blank to use your page snippet)",
                description: `Social media description (og:description).`
            })
        );

        this.addField(
            new FileManagerElement("image", {
                name: "settings.social.image",
                label: "Social Image",
                description: `Linked via "og:image" tag. Recommended resolution 1596x545.`,
                onChangePickAttributes: ["id", "src"]
            })
        );

        const metaTags = new DynamicFieldsetElement("metaTags", { name: "settings.social.meta" });

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
                new InputElement(`metaTags.${index}.property`, {
                    name: `settings.social.meta.${index}.property`,
                    label: "Property",
                    validators: validation.create("required"),
                    beforeChange: (tag, cb) => cb(trim(tag))
                })
            );
            const contentElement = new InputElement(`metaTags.${index}.content`, {
                name: `settings.social.meta.${index}.content`,
                label: "Content",
                validators: validation.create("required"),
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

        this.applyPlugins(SocialSettingsView);
    }
}
