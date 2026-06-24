import { makeAutoObservable, runInAction, computed } from "mobx";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModel } from "~/types.js";
import { ListModelGroupsUseCase } from "~/features/modelGroup/listModelGroups/abstractions.js";
import { CreateModelUseCase } from "~/features/model/createModel/abstractions.js";
import { ModelGroupsCache } from "~/features/modelGroup/abstractions.js";
import { ModelsCache } from "~/features/model/abstractions.js";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import {
    NewContentModelPresenter as Abstraction,
    type INewContentModelPresenter,
    type INewContentModelPresenterViewModel
} from "./abstractions.js";

class NewContentModelPresenterImpl implements INewContentModelPresenter {
    private _loading = true;
    private _saving = false;
    private _form: IFormModel;

    constructor(
        private formModelFactory: FormModelFactory.Interface,
        private listModelGroupsUseCase: ListModelGroupsUseCase.Interface,
        private createModelUseCase: CreateModelUseCase.Interface,
        private groupsCache: ModelGroupsCache.Interface,
        private modelsCache: ModelsCache.Interface
    ) {
        this._form = this.buildForm();
        makeAutoObservable<
            NewContentModelPresenterImpl,
            | "formModelFactory"
            | "listModelGroupsUseCase"
            | "createModelUseCase"
            | "groupsCache"
            | "modelsCache"
        >(this, {
            formModelFactory: false,
            listModelGroupsUseCase: false,
            createModelUseCase: false,
            groupsCache: false,
            modelsCache: false,
            vm: computed
        });
    }

    get vm(): INewContentModelPresenterViewModel {
        const groups = this.groupsCache.getItems().map(g => ({
            value: g.slug,
            label: g.name
        }));

        return {
            loading: this._loading,
            saving: this._saving,
            groups,
            models: this.modelsCache.getItems(),
            form: this._form.vm
        };
    }

    async init(): Promise<void> {
        try {
            await this.listModelGroupsUseCase.execute();
        } finally {
            runInAction(() => {
                this._loading = false;
                const groups = this.groupsCache.getItems();
                if (groups.length > 0) {
                    this._form.setData({ group: groups[0].slug });
                }
            });
        }
    }

    async save(): Promise<CmsModel | null> {
        const data = await this._form.submit<Record<string, any>>();
        if (!data) {
            return null;
        }

        runInAction(() => {
            this._saving = true;
        });

        try {
            const tags: string[] = Array.isArray(data.tags) ? data.tags : [];
            let pluralApiName = data.pluralApiName as string;

            if (data.singleEntry) {
                tags.push(CMS_MODEL_SINGLETON_TAG);
                pluralApiName = `${data.singularApiName}Unused`;
            }

            const model = await this.createModelUseCase.execute({
                name: data.name as string,
                singularApiName: data.singularApiName as string,
                pluralApiName,
                group: data.group as string,
                icon: data.icon as string | undefined,
                description: data.description as string | undefined,
                defaultFields: data.defaultFields as boolean | undefined,
                tags
            });

            return model;
        } catch {
            return null;
        } finally {
            runInAction(() => {
                this._saving = false;
            });
        }
    }

    reset(): void {
        this._form = this.buildForm();
        const groups = this.groupsCache.getItems();
        if (groups.length > 0) {
            this._form.setData({ group: groups[0].slug });
        }
    }

    private buildForm(): IFormModel {
        return this.formModelFactory.create({
            fields: fields => ({
                name: fields.text().label("Name").required("Name is required."),
                singularApiName: fields
                    .text()
                    .label("Singular API Name")
                    .required("Singular API Name is required."),
                singleEntry: fields.boolean().label("Single entry model").defaultValue(false),
                pluralApiName: fields.text().label("Plural API Name"),
                group: fields.text().label("Content model group").required("Group is required."),
                icon: fields.text().label("Icon").renderer("cmsIconPicker"),
                description: fields.text().label("Description").renderer("textarea"),
                defaultFields: fields
                    .boolean()
                    .label("Create model with default fields")
                    .defaultValue(true)
            }),
            layout: layout => [
                layout.row("name"),
                layout.row("singularApiName"),
                layout.row("singleEntry"),
                layout.row("pluralApiName"),
                layout.row("group"),
                layout.row("icon"),
                layout.row("description"),
                layout.row("defaultFields")
            ]
        });
    }
}

export const NewContentModelPresenterImplementation = Abstraction.createImplementation({
    implementation: NewContentModelPresenterImpl,
    dependencies: [
        FormModelFactory,
        ListModelGroupsUseCase,
        CreateModelUseCase,
        ModelGroupsCache,
        ModelsCache
    ]
});
