import { makeAutoObservable } from "mobx";
import { FeatureFlagsService } from "~/features/featureFlags/abstractions.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { AssumedRoleContext } from "~/features/assumedRole/abstractions.js";
import { AssumeRoleUseCase } from "~/features/assumedRole/abstractions.js";
import { ListAssumableRolesUseCase } from "~/features/assumedRole/abstractions.js";
import { AssumedRolePresenter as Abstraction } from "./abstractions.js";

type AssumableRole = ListAssumableRolesUseCase.Role;
type Permission = AssumableRole["permissions"][number];

function optionValue(entry: { type: string; id: string }): string {
    return `${entry.type}:${entry.id}`;
}

function grantsFullAccess(permissions: Permission[]): boolean {
    return permissions.some(permission => permission.name === "*");
}

/*
 * Bare permissions known to only gate access. `cms.endpoint.*` decides which CMS GraphQL endpoint a
 * request may reach (see checkEndpointAccess in api-headless-cms); what can be done there is up to
 * the other CMS permissions, so it cannot write by itself.
 */
function isAccessGate(name: string): boolean {
    return name.startsWith("cms.endpoint.");
}

function grantsWrite(permission: Permission): boolean {
    if (permission.name === "*") {
        return true;
    }

    if (typeof permission.pw === "string" && permission.pw !== "") {
        return true;
    }

    // "Own records" scoping still lets the holder edit what they created.
    if (permission.own === true) {
        return true;
    }

    if (typeof permission.rwd === "string") {
        return permission.rwd.includes("w") || permission.rwd.includes("d");
    }

    /*
     * No rwd means the API only checks that the permission exists, and for most of them that is
     * full control. `security.role` alone lets its holder create and delete roles. So a bare
     * permission counts as writing unless it is a known access gate.
     */
    return !isAccessGate(permission.name);
}

/*
 * Conservative on purpose: a role only counts as read-only when it reads something and nothing in
 * it could write. A wrong "Read-only" chip would tell someone a role is harmless when it is not.
 */
function isReadOnly(permissions: Permission[]): boolean {
    if (permissions.some(grantsWrite)) {
        return false;
    }

    return permissions.some(permission => {
        return typeof permission.rwd === "string" && permission.rwd.includes("r");
    });
}

function toOption(entry: AssumableRole, isCurrent: boolean): Abstraction.Option {
    return {
        value: optionValue(entry),
        type: entry.type,
        label: entry.name,
        description: entry.description,
        isCurrent,
        fullAccess: grantsFullAccess(entry.permissions),
        readOnly: isReadOnly(entry.permissions),
        permissionNames: entry.permissions.map(permission => permission.name)
    };
}

function reloadPage(): void {
    window.location.reload();
}

function toMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
}

class AssumedRolePresenterImpl implements Abstraction.Interface {
    private loading = false;
    private switching = false;
    private roles: AssumableRole[] = [];
    private teams: AssumableRole[] = [];
    private error: string | null = null;
    /*
     * The role this page was LOADED with, captured once. The banner renders from this rather than
     * from the live context so it doesn't flicker during a switch: assuming a role would otherwise
     * pop the banner up a moment before the reload, and exiting would drop it a moment before,
     * both of which read as a glitch. Since every switch reloads, the snapshot and the live value
     * only ever differ inside that window.
     */
    private readonly loadedAssumedRole: AssumedRoleContext.Value | null;

    constructor(
        assumedRoleContext: AssumedRoleContext.Interface,
        private assumeRoleUseCase: AssumeRoleUseCase.Interface,
        private listAssumableRolesUseCase: ListAssumableRolesUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private featureFlags: FeatureFlagsService.Interface
    ) {
        this.loadedAssumedRole = assumedRoleContext.get();
        makeAutoObservable(this, {}, { autoBind: true });

        /*
         * Preload, but only for a page that loaded into a preview. That is the one case where a
         * header control exists to open, and it should open on a ready list rather than a spinner.
         * On the other 99% of page loads nobody is switching roles, so nothing is fetched.
         */
        if (this.loadedAssumedRole) {
            void this.load();
        }
    }

    get vm(): Abstraction.ViewModel {
        const identity = this.identityContext.getIdentity();
        const roleIds = identity.roles.map(role => role.id);
        const teamIds = identity.teams.map(team => team.id);
        const ownRoleIds = new Set(roleIds);
        const ownTeamIds = new Set(teamIds);

        const roleOptions = this.roles.map(role => {
            const isCurrent = ownRoleIds.has(role.id);
            return toOption(role, isCurrent);
        });
        const teamOptions = this.teams.map(team => {
            const isCurrent = ownTeamIds.has(team.id);
            return toOption(team, isCurrent);
        });

        return {
            loading: this.loading,
            switching: this.switching,
            roleOptions,
            teamOptions,
            assumedRole: this.loadedAssumedRole,
            error: this.error
        };
    }

    async load(): Promise<void> {
        const hasOptions = this.roles.length > 0 || this.teams.length > 0;

        /*
         * Only show the loader when there is nothing to show yet. Every later call refreshes in the
         * background, so a role or team added since the last time still turns up without the list
         * blanking out first.
         */
        this.startLoading(!hasOptions);

        const includeTeams = this.featureFlags
            .getFlags()
            .isEnabled("advancedAccessControlLayer.teams");

        try {
            const result = await this.listAssumableRolesUseCase.execute({ includeTeams });
            this.setEntries(result.roles, result.teams);
        } catch (error) {
            const message = toMessage(error, "Could not load roles.");
            this.setError(message);
        } finally {
            this.stopLoading();
        }
    }

    async assume(value: string): Promise<void> {
        const entries = [...this.roles, ...this.teams];
        const entry = entries.find(item => optionValue(item) === value);

        if (!entry) {
            return;
        }

        await this.switchTo({ type: entry.type, id: entry.id, name: entry.name });
    }

    async exit(): Promise<void> {
        await this.switchTo(null);
    }

    dismissError(): void {
        this.error = null;
    }

    private async switchTo(target: AssumeRoleUseCase.Target | null): Promise<void> {
        this.startSwitching();

        try {
            await this.assumeRoleUseCase.execute(target);
        } catch (error) {
            const message = toMessage(error, "Could not switch roles.");
            this.failSwitching(message);
            return;
        }

        /*
         * A full reload, not an in-place identity swap. Permission checks such as
         * `createHasPermission` read the identity during render without observing it, and every
         * list fetched under the old role is still cached, so a swap leaves parts of the Admin,
         * such as menus and the dashboard, still showing the previous role. The tenant switcher
         * reaches for a full page load for the same reason.
         *
         * `switching` stays true on purpose: the page is on its way out, and the control should
         * not look ready for another click in the meantime.
         */
        reloadPage();
    }

    private startLoading(showLoader: boolean): void {
        this.loading = showLoader;
        this.error = null;
    }

    private stopLoading(): void {
        this.loading = false;
    }

    private setEntries(roles: AssumableRole[], teams: AssumableRole[]): void {
        this.roles = roles;
        this.teams = teams;
    }

    private setError(message: string): void {
        this.error = message;
    }

    private startSwitching(): void {
        this.switching = true;
        this.error = null;
    }

    private failSwitching(message: string): void {
        this.switching = false;
        this.error = message;
    }
}

export const AssumedRolePresenter = Abstraction.createImplementation({
    implementation: AssumedRolePresenterImpl,
    dependencies: [
        AssumedRoleContext,
        AssumeRoleUseCase,
        ListAssumableRolesUseCase,
        IdentityContext,
        FeatureFlagsService
    ]
});
