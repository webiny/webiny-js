import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { ModelGroupDto } from "~/features/modelGroup/listModelGroups/abstractions.js";

export interface IModelGroupPresenterViewModel {
    selectedGroup: ModelGroupDto | null;
    loading: boolean;
    saving: boolean;
    showForm: boolean;
    canModify: boolean;
    isPluginGroup: boolean;
    form: IFormVM;
}

export interface IModelGroupPresenter {
    readonly vm: IModelGroupPresenterViewModel;
    readonly list: IListPresenter<ModelGroupDto>;
    init(): void;
    selectGroup(id: string): Promise<void>;
    createNew(): void;
    deselect(): void;
    save(): Promise<ModelGroupDto | null>;
    deleteGroup(id: string): Promise<void>;
}

export const ModelGroupPresenter =
    createAbstraction<IModelGroupPresenter>("CmsModelGroup/Presenter");

export namespace ModelGroupPresenter {
    export type Interface = IModelGroupPresenter;
    export type ViewModel = IModelGroupPresenterViewModel;
}
