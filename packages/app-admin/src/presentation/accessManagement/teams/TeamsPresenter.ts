import { makeAutoObservable, runInAction, computed } from "mobx";
import { ListPresenter } from "~/presentation/listPresenter/abstractions.js";
import type { Team } from "~/features/accessManagement/types.js";
import {
    ListTeamsUseCase,
    TeamsListCache
} from "~/features/accessManagement/teams/listTeams/abstractions.js";
import { GetTeamUseCase } from "~/features/accessManagement/teams/getTeam/abstractions.js";
import { CreateTeamUseCase } from "~/features/accessManagement/teams/createTeam/abstractions.js";
import { UpdateTeamUseCase } from "~/features/accessManagement/teams/updateTeam/abstractions.js";
import { DeleteTeamUseCase } from "~/features/accessManagement/teams/deleteTeam/abstractions.js";
import {
    TeamsPresenter as Abstraction,
    type ITeamsPresenter,
    type ITeamsPresenterViewModel
} from "./abstractions.js";
import { TeamsDataSource } from "./TeamsDataSource.js";

class TeamsPresenterImpl implements ITeamsPresenter {
    private _selectedTeam: Team | null = null;
    private _loading = false;
    private _saving = false;
    private _showForm = false;

    constructor(
        private _listPresenter: ListPresenter.Interface<Team>,
        private listTeamsUseCase: ListTeamsUseCase.Interface,
        private getTeamUseCase: GetTeamUseCase.Interface,
        private createTeamUseCase: CreateTeamUseCase.Interface,
        private updateTeamUseCase: UpdateTeamUseCase.Interface,
        private deleteTeamUseCase: DeleteTeamUseCase.Interface,
        private cache: TeamsListCache.Interface
    ) {
        makeAutoObservable<
            TeamsPresenterImpl,
            | "listTeamsUseCase"
            | "getTeamUseCase"
            | "createTeamUseCase"
            | "updateTeamUseCase"
            | "deleteTeamUseCase"
            | "cache"
        >(this, {
            listTeamsUseCase: false,
            getTeamUseCase: false,
            createTeamUseCase: false,
            updateTeamUseCase: false,
            deleteTeamUseCase: false,
            cache: false,
            vm: computed
        });
    }

    get vm(): ITeamsPresenterViewModel {
        const team = this._selectedTeam;
        const systemTeam = team !== null && team.system === true;
        const pluginTeam = team !== null && (team.plugin ?? false);

        return {
            selectedTeam: this._selectedTeam,
            loading: this._loading,
            saving: this._saving,
            showForm: this._showForm,
            canModify: !systemTeam && !pluginTeam
        };
    }

    get list(): ListPresenter.Interface<Team> {
        return this._listPresenter;
    }

    init(): void {
        const dataSource = new TeamsDataSource(this.listTeamsUseCase, this.cache);

        this._listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 1000
        });
    }

    async selectTeam(id: string): Promise<void> {
        runInAction(() => {
            this._loading = true;
            this._showForm = true;
        });

        try {
            const team = await this.getTeamUseCase.execute(id);
            runInAction(() => {
                this._selectedTeam = team;
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    createNew(): void {
        this._selectedTeam = null;
        this._showForm = true;
    }

    deselect(): void {
        this._selectedTeam = null;
        this._showForm = false;
    }

    async save(data: Record<string, any>): Promise<Team | null> {
        runInAction(() => {
            this._saving = true;
        });

        try {
            const roles = (data.roles || []).map((r: any) => (typeof r === "string" ? r : r.id));
            const isUpdate = this._selectedTeam !== null && this._selectedTeam.createdOn;

            if (isUpdate) {
                const team = await this.updateTeamUseCase.execute(this._selectedTeam!.id, {
                    name: data.name,
                    description: data.description,
                    roles
                });
                runInAction(() => {
                    this._selectedTeam = team;
                });
                return team;
            } else {
                const team = await this.createTeamUseCase.execute({
                    name: data.name,
                    slug: data.slug,
                    description: data.description,
                    roles
                });
                runInAction(() => {
                    this._selectedTeam = team;
                });
                return team;
            }
        } catch {
            return null;
        } finally {
            runInAction(() => {
                this._saving = false;
            });
        }
    }

    async deleteTeam(id: string): Promise<void> {
        await this.deleteTeamUseCase.execute(id);

        runInAction(() => {
            if (this._selectedTeam !== null && this._selectedTeam.id === id) {
                this._selectedTeam = null;
                this._showForm = false;
            }
        });
    }
}

export const TeamsPresenterImplementation = Abstraction.createImplementation({
    implementation: TeamsPresenterImpl,
    dependencies: [
        ListPresenter,
        ListTeamsUseCase,
        GetTeamUseCase,
        CreateTeamUseCase,
        UpdateTeamUseCase,
        DeleteTeamUseCase,
        TeamsListCache
    ]
});
