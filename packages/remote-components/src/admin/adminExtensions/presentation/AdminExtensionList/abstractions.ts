import { createAbstraction } from "@webiny/feature/admin";

export interface IAdminExtensionRowViewModel {
    id: string;
    label: string;
    name: string;
    kindLabel: string;
    description: string;
    enabled: boolean;
    savedOn: string;
    /** A switch or delete for this row is in flight; its controls are disabled. */
    busy: boolean;
}

export interface IAdminExtensionListViewModel {
    loading: boolean;
    error: string | null;
    rows: IAdminExtensionRowViewModel[];
}

export interface IAdminExtensionListPresenter {
    readonly vm: IAdminExtensionListViewModel;
    load(): Promise<void>;
    /** Resolves to whether the change was saved; a failure is shown through `vm.error`. */
    setEnabled(id: string, enabled: boolean): Promise<boolean>;
    delete(id: string): Promise<boolean>;
}

export const AdminExtensionListPresenter = createAbstraction<IAdminExtensionListPresenter>(
    "RemoteComponents/AdminExtensionListPresenter"
);

export namespace AdminExtensionListPresenter {
    export type Interface = IAdminExtensionListPresenter;
    export type ViewModel = IAdminExtensionListViewModel;
    export type Row = IAdminExtensionRowViewModel;
}
