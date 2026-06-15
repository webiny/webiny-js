import { makeAutoObservable, runInAction, computed } from "mobx";
import { ListPresenter } from "~/presentation/listPresenter/abstractions.js";
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

    constructor(
        private _listPresenter: ListPresenter.Interface<Role>,
        private listRolesUseCase: ListRolesUseCase.Interface,
        private getRoleUseCase: GetRoleUseCase.Interface,
        private createRoleUseCase: CreateRoleUseCase.Interface,
        private updateRoleUseCase: UpdateRoleUseCase.Interface,
        private deleteRoleUseCase: DeleteRoleUseCase.Interface,
        private cache: RolesListCache.Interface
    ) {
        makeAutoObservable<
            RolesPresenterImpl,
            | "listRolesUseCase"
            | "getRoleUseCase"
            | "createRoleUseCase"
            | "updateRoleUseCase"
            | "deleteRoleUseCase"
            | "cache"
        >(this, {
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
        const systemRole = role !== null && (role.slug === "full-access" || role.system === true);
        const pluginRole = role !== null && (role.plugin ?? false);

        return {
            selectedRole: this._selectedRole,
            loading: this._loading,
            saving: this._saving,
            showForm: this._showForm,
            canModify: !systemRole && !pluginRole
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
            runInAction(() => {
                this._selectedRole = role;
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    createNew(): void {
        this._selectedRole = null;
        this._showForm = true;
    }

    deselect(): void {
        this._selectedRole = null;
        this._showForm = false;
    }

    async save(data: Record<string, any>): Promise<Role | null> {
        runInAction(() => {
            this._saving = true;
        });

        try {
            const isUpdate = this._selectedRole !== null && this._selectedRole.createdOn;

            if (isUpdate) {
                const role = await this.updateRoleUseCase.execute(this._selectedRole!.id, {
                    name: data.name,
                    description: data.description,
                    permissions: data.permissions
                });
                runInAction(() => {
                    this._selectedRole = role;
                });
                return role;
            } else {
                const role = await this.createRoleUseCase.execute({
                    name: data.name,
                    slug: data.slug,
                    description: data.description,
                    permissions: data.permissions
                });
                runInAction(() => {
                    this._selectedRole = role;
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
}

export const RolesPresenterImplementation = Abstraction.createImplementation({
    implementation: RolesPresenterImpl,
    dependencies: [
        ListPresenter,
        ListRolesUseCase,
        GetRoleUseCase,
        CreateRoleUseCase,
        UpdateRoleUseCase,
        DeleteRoleUseCase,
        RolesListCache
    ]
});
