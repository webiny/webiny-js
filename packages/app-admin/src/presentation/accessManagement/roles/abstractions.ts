import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "~/features/formModel/abstractions.js";
import type { IListPresenter } from "~/presentation/listPresenter/abstractions.js";
import type { Role } from "~/features/accessManagement/types.js";

export interface IRolesPresenterViewModel {
    selectedRole: Role | null;
    loading: boolean;
    saving: boolean;
    showForm: boolean;
    canModify: boolean;
    isSystemRole: boolean;
    form: IFormVM;
}

export interface IRolesPresenter {
    readonly vm: IRolesPresenterViewModel;
    readonly list: IListPresenter<Role>;
    init(): void;
    selectRole(id: string): Promise<void>;
    createNew(): void;
    deselect(): void;
    save(): Promise<Role | null>;
    deleteRole(id: string): Promise<void>;
}

export const RolesPresenter = createAbstraction<IRolesPresenter>("AccessManagement/RolesPresenter");

export namespace RolesPresenter {
    export type Interface = IRolesPresenter;
    export type ViewModel = IRolesPresenterViewModel;
}
