import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "~/features/formModel/abstractions.js";
import type { IListPresenter } from "~/presentation/listPresenter/abstractions.js";
import type { ApiKey } from "~/features/accessManagement/types.js";

export interface IApiKeysPresenterViewModel {
    selectedApiKey: ApiKey | null;
    loading: boolean;
    saving: boolean;
    showForm: boolean;
    form: IFormVM;
}

export interface IApiKeysPresenter {
    readonly vm: IApiKeysPresenterViewModel;
    readonly list: IListPresenter<ApiKey>;
    init(): void;
    selectApiKey(id: string): Promise<void>;
    createNew(): void;
    deselect(): void;
    save(): Promise<ApiKey | null>;
    deleteApiKey(id: string): Promise<void>;
}

export const ApiKeysPresenter = createAbstraction<IApiKeysPresenter>(
    "AccessManagement/ApiKeysPresenter"
);

export namespace ApiKeysPresenter {
    export type Interface = IApiKeysPresenter;
    export type ViewModel = IApiKeysPresenterViewModel;
}
