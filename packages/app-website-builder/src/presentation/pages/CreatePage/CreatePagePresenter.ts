import { makeAutoObservable, computed, runInAction } from "mobx";
import type { IFormModel, IFormModelFactory } from "@webiny/app-admin";
import { FormModelFactory } from "@webiny/app-admin";
import { CreatePageUseCase } from "~/features/pages/createPage/abstractions.js";
import type { CreatePageParams } from "~/features/pages/createPage/abstractions.js";
import {
    CreatePagePresenter as PresenterAbstraction,
    PageTypeProvider,
    CreatePageFormModifier
} from "./abstractions.js";
import { PagePath } from "~/shared/PagePath.js";

class CreatePagePresenterImpl implements PresenterAbstraction.Interface {
    private readonly pageTypes;
    private form: IFormModel;
    private selectedPageType = "";
    private folderId = "";
    private loading = false;

    constructor(
        private factory: IFormModelFactory,
        pageTypeProvider: PageTypeProvider.Interface,
        private modifiers: CreatePageFormModifier.Interface[],
        private createPage: CreatePageUseCase.Interface
    ) {
        this.pageTypes = pageTypeProvider.getPageTypes();
        this.form = this.buildForm();

        makeAutoObservable(this, { vm: computed }, { autoBind: true });
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            form: this.form.vm,
            pageTypes: this.pageTypes,
            selectedPageType: this.selectedPageType,
            loading: this.loading
        };
    }

    init(folderId: string): void {
        this.folderId = folderId;
        const staticPage = this.pageTypes.find(p => p.name === "static");
        this.selectedPageType = staticPage ? "static" : this.pageTypes[0]?.name;
        this.form = this.buildForm();
    }

    changePageType(pageType: string): void {
        const previousData = this.form.getData();
        this.selectedPageType = pageType;
        this.form = this.buildForm();
        this.form.setData(previousData);
    }

    async submit() {
        const data = await this.form.submit();
        if (!data) {
            return null;
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
        if (pageType?.mapFromForm) {
            pageType.mapFromForm(data, input);
        }

        // Let cross-cutting modifiers map their form data.
        for (const modifier of this.modifiers) {
            if (modifier.mapFromForm) {
                modifier.mapFromForm(data, input);
            }
        }

        runInAction(() => {
            this.loading = true;
        });
        try {
            return await this.createPage.execute(input);
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    private buildForm(): IFormModel {
        // Layer 1: Base form — always present regardless of page type
        const form = this.factory.create({
            fields: fields => ({
                title: fields
                    .text()
                    .label("Title")
                    .required("Title is required")
                    .onBlur((value, form) => {
                        const currentPath = form.field("path").getValue<string>();
                        if (!PagePath.create(currentPath).isEmpty()) {
                            return;
                        }
                        const newPath = PagePath.fromTitle(String(value)).toString();
                        form.field("path").setValue(newPath);
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
        if (pageType && typeof pageType.modifyForm === "function") {
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
        PageTypeProvider,
        [CreatePageFormModifier, { multiple: true }],
        CreatePageUseCase
    ]
});
