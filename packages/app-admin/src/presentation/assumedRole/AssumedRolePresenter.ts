import { makeAutoObservable, runInAction } from "mobx";
import { FeatureFlagsService } from "~/features/featureFlags/abstractions.js";
import { ListRolesUseCase } from "~/features/accessManagement/roles/listRoles/abstractions.js";
import { ListTeamsUseCase } from "~/features/accessManagement/teams/listTeams/abstractions.js";
import { AssumedRoleContext } from "~/features/assumedRole/index.js";
import { AssumeRoleUseCase } from "~/features/assumedRole/index.js";
import { AssumedRolePresenter as Abstraction } from "./abstractions.js";

function optionValue(assumedRole: AssumedRoleContext.Value): string {
    return `${assumedRole.type}:${assumedRole.id}`;
}

function toMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
}

class AssumedRolePresenterImpl implements Abstraction.Interface {
    private _loading = false;
    private _switching = false;
    private _roleOptions: Abstraction.Option[] = [];
    private _teamOptions: Abstraction.Option[] = [];
    private _error: string | null = null;

    constructor(
        private assumedRoleContext: AssumedRoleContext.Interface,
        private assumeRoleUseCase: AssumeRoleUseCase.Interface,
        private listRolesUseCase: ListRolesUseCase.Interface,
        private listTeamsUseCase: ListTeamsUseCase.Interface,
        private featureFlags: FeatureFlagsService.Interface
    ) {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    get vm(): Abstraction.ViewModel {
        return {
            loading: this._loading,
            switching: this._switching,
            roleOptions: this._roleOptions,
            teamOptions: this._teamOptions,
            assumedRole: this.assumedRoleContext.get(),
            error: this._error
        };
    }

    async load(): Promise<void> {
        runInAction(() => {
            this._loading = true;
            this._error = null;
        });

        try {
            const roles = await this.listRolesUseCase.execute();
            const teamOptions = await this.loadTeamOptions();

            const roleOptions = roles.data.map(role => {
                const assumedRole: AssumedRoleContext.Value = {
                    type: "role",
                    id: role.id,
                    name: role.name
                };

                return { label: role.name, value: optionValue(assumedRole), assumedRole };
            });

            runInAction(() => {
                this._roleOptions = roleOptions;
                this._teamOptions = teamOptions;
            });
        } catch (error) {
            runInAction(() => {
                this._error = toMessage(error, "Could not load roles.");
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    async assume(value: string): Promise<void> {
        const options = [...this._roleOptions, ...this._teamOptions];
        const option = options.find(item => item.value === value);

        if (!option) {
            return;
        }

        await this.switchTo(option.assumedRole);
    }

    async exit(): Promise<void> {
        await this.switchTo(null);
    }

    dismissError(): void {
        runInAction(() => {
            this._error = null;
        });
    }

    private async switchTo(assumedRole: AssumedRoleContext.Value | null): Promise<void> {
        runInAction(() => {
            this._switching = true;
            this._error = null;
        });

        try {
            await this.assumeRoleUseCase.execute(assumedRole);
        } catch (error) {
            runInAction(() => {
                this._error = toMessage(error, "Could not switch roles.");
            });
        } finally {
            runInAction(() => {
                this._switching = false;
            });
        }
    }

    private async loadTeamOptions(): Promise<Abstraction.Option[]> {
        const teamsEnabled = this.featureFlags
            .getFlags()
            .isEnabled("advancedAccessControlLayer.teams");

        if (!teamsEnabled) {
            return [];
        }

        const teams = await this.listTeamsUseCase.execute();

        return teams.data.map(team => {
            const assumedRole: AssumedRoleContext.Value = {
                type: "team",
                id: team.id,
                name: team.name
            };

            return { label: team.name, value: optionValue(assumedRole), assumedRole };
        });
    }
}

export const AssumedRolePresenter = Abstraction.createImplementation({
    implementation: AssumedRolePresenterImpl,
    dependencies: [
        AssumedRoleContext,
        AssumeRoleUseCase,
        ListRolesUseCase,
        ListTeamsUseCase,
        FeatureFlagsService
    ]
});
