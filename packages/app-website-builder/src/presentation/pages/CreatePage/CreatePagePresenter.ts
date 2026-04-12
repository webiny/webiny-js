import { makeAutoObservable, computed } from "mobx";
import type { IFormModel, IFormModelFactory } from "@webiny/app-admin";
import { FormModelFactory } from "@webiny/app-admin";
import type { CreatePageParams } from "~/features/pages/createPage/abstractions.js";
import {
    CreatePagePresenter as PresenterAbstraction,
    PageType,
    CreatePageFormModifier
} from "./abstractions.js";
import { PagePath } from "~/shared/PagePath.js";

class CreatePagePresenterImpl implements PresenterAbstraction.Interface {
    private form: IFormModel;
    private selectedPageType = "";
    private folderId = "";

    constructor(
        private factory: IFormModelFactory,
        private pageTypes: PageType.Interface[],
        private modifiers: CreatePageFormModifier.Interface[]
    ) {
        this.form = this.buildForm();
        makeAutoObservable(this, { vm: computed }, { autoBind: true });
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            form: this.form.vm,
            pageTypes: this.pageTypes.map(t => ({ name: t.name, label: t.label })),
            selectedPageType: this.selectedPageType
        };
    }

    init(pageType: string, folderId: string): void {
        this.selectedPageType = pageType;
        this.folderId = folderId;
        this.form = this.buildForm();
    }

    async submit(): Promise<CreatePageParams | false> {
        const data = await this.form.submit();
        if (!data) {
            return false;
        }

        const input: CreatePageParams = {
            location: {
                folderId: String(data.folderId)
            },
            properties: {
                title: data.title,
                path: data.path
            },
            metadata: {
                documentType: "page",
                pageType: data.pageType
            },
            elements: {
                root: {
                    type: "Webiny/Element",
                    id: "root",
                    component: {
                        name: "Webiny/Root"
                    }
                }
            }
        };

        // Let the active page type map its form data.
        const pageType = this.pageTypes.find(pt => pt.name === this.selectedPageType);
        if (pageType?.mapFormData) {
            pageType.mapFormData(data, input);
        }

        // Let cross-cutting modifiers map their form data.
        for (const modifier of this.modifiers) {
            if (modifier.mapFormData) {
                modifier.mapFormData(data, input);
            }
        }

        return input;
    }

    private buildForm(): IFormModel {
        // Layer 1: Base form — always present regardless of page type
        const form = this.factory.create({
            fields: fields => ({
                title: fields
                    .text()
                    .label("Title")
                    .required("Title is required")
                    .onBlur((value, f) => {
                        const currentPath = f.field("path").getValue<string>();
                        if (!PagePath.create(currentPath).isEmpty()) {
                            return;
                        }
                        const newPath = PagePath.fromTitle(String(value)).toString();
                        f.field("path").setValue(newPath);
                    }),
                path: fields
                    .text()
                    .label("Path")
                    .required("Path is required")
                    .beforeChange(value => {
                        return PagePath.create(String(value)).slugify().toString();
                    }),
                pageType: fields
                    .text()
                    .hidden()
                    .defaultValue(this.selectedPageType || "static"),
                folderId: fields.text().hidden().defaultValue(this.folderId)
            }),
            layout: layout => [layout.row("title"), layout.row("path")]
        });

        // Layer 2: Apply the selected page type's modifications
        const pageType = this.pageTypes.find(pt => pt.name === this.selectedPageType);
        if (pageType) {
            pageType.modifyForm(form);
        }

        // Layer 3: Apply cross-cutting modifiers (Language, etc.)
        for (const modifier of this.modifiers) {
            modifier.modifyForm(form);
        }

        return form;
    }
}

export const CreatePagePresenter = PresenterAbstraction.createImplementation({
    implementation: CreatePagePresenterImpl,
    dependencies: [
        FormModelFactory,
        [PageType, { multiple: true }],
        [CreatePageFormModifier, { multiple: true }]
    ]
});
