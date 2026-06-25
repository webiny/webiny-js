import { makeAutoObservable, runInAction, computed } from "mobx";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModel } from "~/types.js";
import { ListModelGroupsUseCase } from "~/features/modelGroup/listModelGroups/abstractions.js";
import { CloneModelUseCase } from "~/features/model/cloneModel/abstractions.js";
import { ModelGroupsCache } from "~/features/modelGroup/abstractions.js";
import { ModelsCache } from "~/features/model/abstractions.js";
import {
    CloneContentModelPresenter as Abstraction,
    type ICloneContentModelPresenter,
    type ICloneContentModelPresenterViewModel
} from "./abstractions.js";

class CloneContentModelPresenterImpl implements ICloneContentModelPresenter {
    private loading = true;
    private saving = false;
    private form: IFormModel;
    private sourceModel: CmsModel | null = null;

    constructor(
        private formModelFactory: FormModelFactory.Interface,
        private listModelGroupsUseCase: ListModelGroupsUseCase.Interface,
        private cloneModelUseCase: CloneModelUseCase.Interface,
        private groupsCache: ModelGroupsCache.Interface,
        private modelsCache: ModelsCache.Interface
    ) {
        this.form = this.buildForm();
        makeAutoObservable<
            CloneContentModelPresenterImpl,
            | "formModelFactory"
            | "listModelGroupsUseCase"
            | "cloneModelUseCase"
            | "groupsCache"
            | "modelsCache"
        >(this, {
            formModelFactory: false,
            listModelGroupsUseCase: false,
            cloneModelUseCase: false,
            groupsCache: false,
            modelsCache: false,
            vm: computed
        });
    }

    get vm(): ICloneContentModelPresenterViewModel {
        const groups = this.groupsCache.getItems().map(g => ({
            value: g.slug,
            label: g.name
        }));

        return {
            loading: this.loading,
            saving: this.saving,
            groups,
            models: this.modelsCache.getItems(),
            form: this.form.vm
        };
    }

    async init(sourceModel: CmsModel): Promise<void> {
        this.sourceModel = sourceModel;

        try {
            await this.listModelGroupsUseCase.execute();
        } finally {
            runInAction(() => {
                this.loading = false;
                this.form = this.buildForm();
                this.form.setData({
                    name: sourceModel.name,
                    group: sourceModel.group
                });
            });
        }
    }

    async save(): Promise<CmsModel | null> {
        if (!this.sourceModel) {
            return null;
        }

        const data = await this.form.submit<Record<string, any>>();
        if (!data) {
            return null;
        }

        runInAction(() => {
            this.saving = true;
        });

        try {
            const model = await this.cloneModelUseCase.execute({
                modelId: this.sourceModel.modelId,
                data: {
                    name: data.name as string,
                    singularApiName: data.singularApiName as string | undefined,
                    pluralApiName: data.pluralApiName as string | undefined,
                    group: data.group as string | undefined,
                    icon: data.icon as string | undefined,
                    description: data.description as string | undefined
                }
            });

            return model;
        } catch {
            return null;
        } finally {
            runInAction(() => {
                this.saving = false;
            });
        }
    }

    reset(): void {
        this.sourceModel = null;
        this.form = this.buildForm();
    }

    private buildForm(): IFormModel {
        return this.formModelFactory.create({
            fields: fields => ({
                name: fields.text().label("Name").required("Name is required."),
                singularApiName: fields
                    .text()
                    .label("Singular API Name")
                    .required("Singular API Name is required."),
                pluralApiName: fields
                    .text()
                    .label("Plural API Name")
                    .required("Plural API Name is required."),
                group: fields.text().label("Content model group").required("Group is required."),
                icon: fields.text().label("Icon").renderer("cmsIconPicker"),
                description: fields.text().label("Description").renderer("textarea")
            }),
            layout: layout => [
                layout.row("name"),
                layout.row("singularApiName"),
                layout.row("pluralApiName"),
                layout.row("group"),
                layout.row("icon"),
                layout.row("description")
            ]
        });
    }
}

export const CloneContentModelPresenter = Abstraction.createImplementation({
    implementation: CloneContentModelPresenterImpl,
    dependencies: [
        FormModelFactory,
        ListModelGroupsUseCase,
        CloneModelUseCase,
        ModelGroupsCache,
        ModelsCache
    ]
});
