import { makeAutoObservable, runInAction, computed } from "mobx";
import slugify from "slugify";
import { ListPresenter } from "~/presentation/listPresenter/abstractions.js";
import { FormModelFactory } from "~/features/formModel/abstractions.js";
import type { IFormModel } from "~/features/formModel/abstractions.js";
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
    private _form: IFormModel;
    private _isNew = false;

    constructor(
        private _listPresenter: ListPresenter.Interface<Team>,
        private formModelFactory: FormModelFactory.Interface,
        private listTeamsUseCase: ListTeamsUseCase.Interface,
        private getTeamUseCase: GetTeamUseCase.Interface,
        private createTeamUseCase: CreateTeamUseCase.Interface,
        private updateTeamUseCase: UpdateTeamUseCase.Interface,
        private deleteTeamUseCase: DeleteTeamUseCase.Interface,
        private cache: TeamsListCache.Interface
    ) {
        this._form = this.buildForm(false, true);
        makeAutoObservable<
            TeamsPresenterImpl,
            | "formModelFactory"
            | "listTeamsUseCase"
            | "getTeamUseCase"
            | "createTeamUseCase"
            | "updateTeamUseCase"
            | "deleteTeamUseCase"
            | "cache"
        >(this, {
            formModelFactory: false,
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
            canModify: !systemTeam && !pluginTeam,
            form: this._form.vm
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
            this._isNew = false;
        });

        try {
            const team = await this.getTeamUseCase.execute(id);
            const systemTeam = team.system === true;
            const pluginTeam = team.plugin ?? false;
            const canModify = !systemTeam && !pluginTeam;

            runInAction(() => {
                this._selectedTeam = team;
                this._form = this.buildForm(false, canModify);
                this._form.setData({
                    name: team.name,
                    slug: team.slug,
                    description: team.description,
                    roles: team.roles || []
                });
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    createNew(): void {
        this._selectedTeam = null;
        this._isNew = true;
        this._form = this.buildForm(true, true);
        this._showForm = true;
    }

    deselect(): void {
        this._selectedTeam = null;
        this._showForm = false;
    }

    async save(): Promise<Team | null> {
        const data = await this._form.submit();
        if (!data) {
            return null;
        }

        runInAction(() => {
            this._saving = true;
        });

        try {
            const roles = ((data.roles as any[]) || []).map((r: any) =>
                typeof r === "string" ? r : r.id
            );
            const isUpdate = this._selectedTeam !== null && this._selectedTeam.createdOn;

            if (isUpdate) {
                const team = await this.updateTeamUseCase.execute(this._selectedTeam!.id, {
                    name: data.name as string,
                    description: data.description as string,
                    roles
                });
                runInAction(() => {
                    this._selectedTeam = team;
                });
                return team;
            } else {
                const team = await this.createTeamUseCase.execute({
                    name: data.name as string,
                    slug: data.slug as string,
                    description: data.description as string,
                    roles
                });
                runInAction(() => {
                    this._selectedTeam = team;
                    this._isNew = false;
                    this._form = this.buildForm(false, true);
                    this._form.setData({
                        name: team.name,
                        slug: team.slug,
                        description: team.description,
                        roles: team.roles || []
                    });
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
                description: fields
                    .text()
                    .label("Description")
                    .renderer("textarea")
                    .defaultValue("")
                    .disabled(!canModify),
                roles: fields
                    .rolesMultiSelect()
                    .label("Roles")
                    .required("Roles are required.")
                    .disabled(!canModify)
            }),
            layout: layout => [
                layout.row("name", "slug"),
                layout.row("description"),
                layout.row("roles")
            ]
        });
    }
}

export const TeamsPresenterImplementation = Abstraction.createImplementation({
    implementation: TeamsPresenterImpl,
    dependencies: [
        ListPresenter,
        FormModelFactory,
        ListTeamsUseCase,
        GetTeamUseCase,
        CreateTeamUseCase,
        UpdateTeamUseCase,
        DeleteTeamUseCase,
        TeamsListCache
    ]
});
