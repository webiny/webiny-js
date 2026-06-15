import { makeAutoObservable, runInAction, computed } from "mobx";
import slugify from "slugify";
import { ListPresenter } from "~/presentation/listPresenter/abstractions.js";
import { FormModelFactory } from "~/features/formModel/abstractions.js";
import type { IFormModel } from "~/features/formModel/abstractions.js";
import type { Role } from "~/features/accessManagement/types.js";
import {
    ListRolesUseCase,
    RolesListCache
} from "~/features/accessManagement/roles/listRoles/abstractions.js";
import { GetRoleUseCase } from "~/features/accessManagement/roles/getRole/abstractions.js";
import { CreateRoleUseCase } from "~/features/accessManagement/roles/createRole/abstractions.js";
import { UpdateRoleUseCase } from "~/features/accessManagement/roles/updateRole/abstractions.js";
import { DeleteRoleUseCase } from "~/features/accessManagement/roles/deleteRole/abstractions.js";
import {
    RolesPresenter as Abstraction,
    type IRolesPresenter,
    type IRolesPresenterViewModel
} from "./abstractions.js";
import { RolesDataSource } from "./RolesDataSource.js";

class RolesPresenterImpl implements IRolesPresenter {
    private _selectedRole: Role | null = null;
    private _loading = false;
    private _saving = false;
    private _showForm = false;
    private _form: IFormModel;

    constructor(
        private _listPresenter: ListPresenter.Interface<Role>,
        private formModelFactory: FormModelFactory.Interface,
        private listRolesUseCase: ListRolesUseCase.Interface,
        private getRoleUseCase: GetRoleUseCase.Interface,
        private createRoleUseCase: CreateRoleUseCase.Interface,
        private updateRoleUseCase: UpdateRoleUseCase.Interface,
        private deleteRoleUseCase: DeleteRoleUseCase.Interface,
        private cache: RolesListCache.Interface
    ) {
        this._form = this.buildForm(false, false);
        makeAutoObservable<
            RolesPresenterImpl,
            | "formModelFactory"
            | "listRolesUseCase"
            | "getRoleUseCase"
            | "createRoleUseCase"
            | "updateRoleUseCase"
            | "deleteRoleUseCase"
            | "cache"
        >(this, {
            formModelFactory: false,
            listRolesUseCase: false,
            getRoleUseCase: false,
            createRoleUseCase: false,
            updateRoleUseCase: false,
            deleteRoleUseCase: false,
            cache: false,
            vm: computed
        });
    }

    get vm(): IRolesPresenterViewModel {
        const role = this._selectedRole;
        const isSystemRole = role !== null && (role.slug === "full-access" || role.system === true);
        const isPluginRole = role !== null && (role.plugin ?? false);

        return {
            selectedRole: this._selectedRole,
            loading: this._loading,
            saving: this._saving,
            showForm: this._showForm,
            canModify: !isSystemRole && !isPluginRole,
            isSystemRole,
            form: this._form.vm
        };
    }

    get list(): ListPresenter.Interface<Role> {
        return this._listPresenter;
    }

    init(): void {
        const dataSource = new RolesDataSource(this.listRolesUseCase, this.cache);

        this._listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 1000
        });
    }

    async selectRole(id: string): Promise<void> {
        runInAction(() => {
            this._loading = true;
            this._showForm = true;
        });

        try {
            const role = await this.getRoleUseCase.execute(id);
            const isSystemRole = role.slug === "full-access" || role.system === true;
            const isPluginRole = role.plugin ?? false;
            const canModify = !isSystemRole && !isPluginRole;

            runInAction(() => {
                this._selectedRole = role;
                this._form = this.buildForm(false, canModify, role.id);
                this._form.setData({
                    name: role.name,
                    slug: role.slug,
                    description: role.description,
                    permissions: role.permissions || []
                });
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    createNew(): void {
        this._selectedRole = null;
        this._form = this.buildForm(true, true, "new");
        this._showForm = true;
    }

    deselect(): void {
        this._selectedRole = null;
        this._showForm = false;
    }

    async save(): Promise<Role | null> {
        const data = await this._form.submit<Role>();
        if (!data) {
            return null;
        }

        runInAction(() => {
            this._saving = true;
        });

        try {
            const isUpdate = this._selectedRole !== null && this._selectedRole.createdOn;

            if (isUpdate) {
                const role = await this.updateRoleUseCase.execute(this._selectedRole!.id, {
                    name: data.name as string,
                    description: data.description as string,
                    permissions: data.permissions
                });
                runInAction(() => {
                    this._selectedRole = role;
                });
                return role;
            } else {
                const role = await this.createRoleUseCase.execute({
                    name: data.name as string,
                    slug: data.slug as string,
                    description: data.description as string,
                    permissions: data.permissions
                });
                runInAction(() => {
                    this._selectedRole = role;
                    this._form = this.buildForm(false, true, role.id);
                    this._form.setData({
                        name: role.name,
                        slug: role.slug,
                        description: role.description,
                        permissions: role.permissions || []
                    });
                });
                return role;
            }
        } catch {
            return null;
        } finally {
            runInAction(() => {
                this._saving = false;
            });
        }
    }

    async deleteRole(id: string): Promise<void> {
        await this.deleteRoleUseCase.execute(id);

        runInAction(() => {
            if (this._selectedRole !== null && this._selectedRole.id === id) {
                this._selectedRole = null;
                this._showForm = false;
            }
        });
    }

    private buildForm(isNew: boolean, canModify: boolean, entityId?: string): IFormModel {
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
                description: fields
                    .text()
                    .label("Description")
                    .renderer("textarea")
                    .disabled(!canModify),
                permissions: fields
                    .permissions()
                    .label("Permissions")
                    .renderer("permissions", { id: entityId || "new" })
                    .hiddenWhen(() => {
                        const role = this._selectedRole;
                        return (
                            role !== null && (role.slug === "full-access" || role.system === true)
                        );
                    })
            }),
            layout: layout => [
                layout.row("name", "slug"),
                layout.row("description"),
                layout.row("permissions")
            ]
        });
    }
}

export const RolesPresenterImplementation = Abstraction.createImplementation({
    implementation: RolesPresenterImpl,
    dependencies: [
        ListPresenter,
        FormModelFactory,
        ListRolesUseCase,
        GetRoleUseCase,
        CreateRoleUseCase,
        UpdateRoleUseCase,
        DeleteRoleUseCase,
        RolesListCache
    ]
});
