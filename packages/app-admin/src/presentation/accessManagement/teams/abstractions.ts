import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "~/features/formModel/abstractions.js";
import type { IListPresenter } from "~/presentation/listPresenter/abstractions.js";
import type { Team } from "~/features/accessManagement/types.js";

export interface ITeamsPresenterViewModel {
    selectedTeam: Team | null;
    loading: boolean;
    saving: boolean;
    showForm: boolean;
    canModify: boolean;
    form: IFormVM;
}

export interface ITeamsPresenter {
    readonly vm: ITeamsPresenterViewModel;
    readonly list: IListPresenter<Team>;
    init(): void;
    selectTeam(id: string): Promise<void>;
    createNew(): void;
    deselect(): void;
    save(): Promise<Team | null>;
    deleteTeam(id: string): Promise<void>;
}

export const TeamsPresenter = createAbstraction<ITeamsPresenter>("AccessManagement/TeamsPresenter");

export namespace TeamsPresenter {
    export type Interface = ITeamsPresenter;
    export type ViewModel = ITeamsPresenterViewModel;
}
