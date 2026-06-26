import { makeAutoObservable, runInAction, computed } from "mobx";
import slugify from "slugify";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { ModelGroupDto } from "~/features/modelGroup/listModelGroups/abstractions.js";
import { ListModelGroupsUseCase } from "~/features/modelGroup/listModelGroups/abstractions.js";
import { GetModelGroupUseCase } from "~/features/modelGroup/getModelGroup/abstractions.js";
import { CreateModelGroupUseCase } from "~/features/modelGroup/createModelGroup/abstractions.js";
import { UpdateModelGroupUseCase } from "~/features/modelGroup/updateModelGroup/abstractions.js";
import { DeleteModelGroupUseCase } from "~/features/modelGroup/deleteModelGroup/abstractions.js";
import { ModelGroupsCache } from "~/features/modelGroup/abstractions.js";
import {
    ModelGroupPresenter as Abstraction,
    type IModelGroupPresenter,
    type IModelGroupPresenterViewModel
} from "./abstractions.js";
import { ModelGroupDataSource } from "./ModelGroupDataSource.js";

function extractIconName(icon: unknown): string {
    if (icon !== null && typeof icon === "object" && "name" in icon) {
        return (icon as { name: string }).name;
    }
    if (typeof icon === "string") {
        return icon;
    }
    return "";
}

function toIconValue(name: string): { type: string; name: string } {
    return { type: "icon", name };
}

class ModelGroupPresenterImpl implements IModelGroupPresenter {
    private selectedGroup: ModelGroupDto | null = null;
    private loading = false;
    private saving = false;
    private showForm = false;
    private form: IFormModel;

    constructor(
        private listPresenter: ListPresenter.Interface<ModelGroupDto>,
        private formModelFactory: FormModelFactory.Interface,
        private listModelGroupsUseCase: ListModelGroupsUseCase.Interface,
        private getRoleUseCase: GetModelGroupUseCase.Interface,
        private createModelGroupUseCase: CreateModelGroupUseCase.Interface,
        private updateModelGroupUseCase: UpdateModelGroupUseCase.Interface,
        private deleteModelGroupUseCase: DeleteModelGroupUseCase.Interface,
        private cache: ModelGroupsCache.Interface
    ) {
        this.form = this.buildForm(false, false);
        makeAutoObservable<
            ModelGroupPresenterImpl,
            | "formModelFactory"
            | "listModelGroupsUseCase"
            | "getRoleUseCase"
            | "createModelGroupUseCase"
            | "updateModelGroupUseCase"
            | "deleteModelGroupUseCase"
            | "cache"
        >(this, {
            formModelFactory: false,
            listModelGroupsUseCase: false,
            getRoleUseCase: false,
            createModelGroupUseCase: false,
            updateModelGroupUseCase: false,
            deleteModelGroupUseCase: false,
            cache: false,
            vm: computed
        });
    }

    get vm(): IModelGroupPresenterViewModel {
        const group = this.selectedGroup;
        const isPluginGroup = group !== null && (group.plugin ?? false);

        return {
            selectedGroup: this.selectedGroup,
            loading: this.loading,
            saving: this.saving,
            showForm: this.showForm,
            canModify: !isPluginGroup,
            isPluginGroup,
            form: this.form.vm
        };
    }

    get list(): ListPresenter.Interface<ModelGroupDto> {
        return this.listPresenter;
    }

    init(): void {
        const dataSource = new ModelGroupDataSource(this.listModelGroupsUseCase, this.cache);

        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 1000
        });
    }

    async selectGroup(id: string): Promise<void> {
        runInAction(() => {
            this.loading = true;
            this.showForm = true;
        });

        try {
            const group = await this.getRoleUseCase.execute(id);
            const isPluginGroup = group.plugin ?? false;
            const canModify = !isPluginGroup;

            runInAction(() => {
                this.selectedGroup = group;
                this.form = this.buildForm(false, canModify);
                this.form.setData({
                    name: group.name,
                    slug: group.slug,
                    description: group.description,
                    icon: extractIconName(group.icon)
                });
            });
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    createNew(): void {
        this.selectedGroup = null;
        this.form = this.buildForm(true, true);
        this.form.setData({ icon: "fas/star", description: "" });
        this.showForm = true;
    }

    deselect(): void {
        this.selectedGroup = null;
        this.showForm = false;
    }

    async save(): Promise<ModelGroupDto | null> {
        const data = await this.form.submit<ModelGroupDto>();
        if (!data) {
            return null;
        }

        runInAction(() => {
            this.saving = true;
        });

        try {
            const isUpdate = this.selectedGroup !== null && this.selectedGroup.createdOn;

            const iconValue = toIconValue(data.icon as unknown as string);

            if (isUpdate) {
                const group = await this.updateModelGroupUseCase.execute({
                    id: this.selectedGroup!.id,
                    name: data.name as unknown as string,
                    slug: this.selectedGroup!.slug,
                    description: data.description as unknown as string,
                    icon: iconValue as unknown as string
                });
                runInAction(() => {
                    this.selectedGroup = group;
                });
                return group;
            } else {
                const group = await this.createModelGroupUseCase.execute({
                    name: data.name as unknown as string,
                    slug: data.slug as unknown as string,
                    description: data.description as unknown as string,
                    icon: iconValue as unknown as string
                });
                runInAction(() => {
                    this.selectedGroup = group;
                    this.form = this.buildForm(false, true);
                    this.form.setData({
                        name: group.name,
                        slug: group.slug,
                        description: group.description,
                        icon: extractIconName(group.icon)
                    });
                });
                return group;
            }
        } catch {
            return null;
        } finally {
            runInAction(() => {
                this.saving = false;
            });
        }
    }

    async deleteGroup(id: string): Promise<void> {
        await this.deleteModelGroupUseCase.execute(id);

        runInAction(() => {
            if (this.selectedGroup !== null && this.selectedGroup.id === id) {
                this.selectedGroup = null;
                this.showForm = false;
            }
        });
    }

    private buildForm(isNew: boolean, canModify: boolean): IFormModel {
        return this.formModelFactory.create({
            fields: fields => ({
                name: fields
                    .text()
                    .label("Name")
                    .required("Name is required.")
                    .disabled(!canModify)
                    .onBlur((value, form) => {
                        const slugValue = form.field("slug").getValue();
                        if (slugValue || !value) {
                            return;
                        }
                        form.field("slug").setValue(
                            slugify(String(value), {
                                replacement: "-",
                                lower: true,
                                remove: /[*#?<>_{}[\]+~.()'"!:;@]/g,
                                trim: false
                            })
                        );
                    }),
                slug: fields
                    .text()
                    .label("Slug")
                    .required("Slug is required.")
                    .disabled(!isNew || !canModify),
                icon: fields
                    .text()
                    .label("Group icon")
                    .required("Icon is required.")
                    .disabled(!canModify)
                    .renderer("cmsIconPicker"),
                description: fields
                    .text()
                    .label("Description")
                    .defaultValue("")
                    .renderer("textarea")
                    .disabled(!canModify)
            }),
            layout: layout => [
                layout.row("name"),
                layout.row("slug"),
                layout.row("icon"),
                layout.row("description")
            ]
        });
    }
}

export const ModelGroupPresenter = Abstraction.createImplementation({
    implementation: ModelGroupPresenterImpl,
    dependencies: [
        ListPresenter,
        FormModelFactory,
        ListModelGroupsUseCase,
        GetModelGroupUseCase,
        CreateModelGroupUseCase,
        UpdateModelGroupUseCase,
        DeleteModelGroupUseCase,
        ModelGroupsCache
    ]
});
