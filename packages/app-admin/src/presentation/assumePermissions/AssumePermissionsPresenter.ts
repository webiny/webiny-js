import { makeAutoObservable } from "mobx";
import { FeatureFlagsService } from "~/features/featureFlags/abstractions.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { AssumePermissionsContext } from "~/features/assumePermissions/abstractions.js";
import { AssumePermissionsUseCase } from "~/features/assumePermissions/abstractions.js";
import { ListAssumableTargetsUseCase } from "~/features/assumePermissions/abstractions.js";
import { AssumePermissionsPresenter as Abstraction } from "./abstractions.js";

type AssumableTarget = ListAssumableTargetsUseCase.Target;

function optionValue(entry: { type: string; id: string }): string {
    return `${entry.type}:${entry.id}`;
}

function toOption(entry: AssumableTarget): Abstraction.Option {
    return { value: optionValue(entry), label: entry.name };
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

class AssumePermissionsPresenterImpl implements Abstraction.Interface {
    private loading = false;
    private switching = false;
    private roles: AssumableTarget[] = [];
    private teams: AssumableTarget[] = [];
    private error: string | null = null;
    /*
     * The role this page was LOADED with, captured once. The banner renders from this rather than
     * from the live context so it doesn't flicker during a switch: starting a preview would
     * otherwise pop the banner up a moment before the reload, and exiting would drop it a moment
     * before, both of which read as a glitch. Since every switch reloads, the snapshot and the live value
     * only ever differ inside that window.
     */
    private readonly loadedAssumed: AssumePermissionsContext.Value | null;

    constructor(
        assumePermissionsContext: AssumePermissionsContext.Interface,
        private assumePermissionsUseCase: AssumePermissionsUseCase.Interface,
        private listAssumableTargetsUseCase: ListAssumableTargetsUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private featureFlags: FeatureFlagsService.Interface
    ) {
        this.loadedAssumed = assumePermissionsContext.get();
        makeAutoObservable(this, {}, { autoBind: true });

        /*
         * Preload, but only for a page that loaded into a preview. That is the one case where a
         * header control exists to open, and it should open on a ready list rather than a spinner.
         * On the other 99% of page loads nobody is switching roles, so nothing is fetched.
         */
        if (this.loadedAssumed) {
            void this.load();
        }
    }

    get vm(): Abstraction.ViewModel {
        const identity = this.identityContext.getIdentity();
        const roleOptions = this.roles.map(toOption);
        const teamOptions = this.teams.map(toOption);

        /*
         * The same rule the API enforces in AssumedPermissions: only a caller with full access can
         * preview. The API doesn't refuse anyone else, it quietly keeps their own permissions, so a
         * looser check here would let someone start a "preview" whose banner is a lie.
         *
         * While a preview is active the identity carries the previewed role's permissions instead.
         * Whoever started it already passed this check, so an active preview is enough.
         */
        const hasFullAccess = identity.getPermission("*", true) !== null;
        const canAssume = this.loadedAssumed !== null || hasFullAccess;

        return {
            loading: this.loading,
            switching: this.switching,
            roleOptions,
            teamOptions,
            assumed: this.loadedAssumed,
            canAssume,
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
            const result = await this.listAssumableTargetsUseCase.execute({ includeTeams });
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

    async assumeTarget(target: AssumePermissionsUseCase.Target): Promise<void> {
        await this.switchTo(target);
    }

    async exit(): Promise<void> {
        await this.switchTo(null);
    }

    dismissError(): void {
        this.error = null;
    }

    private async switchTo(target: AssumePermissionsUseCase.Target | null): Promise<void> {
        this.startSwitching();

        try {
            await this.assumePermissionsUseCase.execute(target);
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

    private setEntries(roles: AssumableTarget[], teams: AssumableTarget[]): void {
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

export const AssumePermissionsPresenter = Abstraction.createImplementation({
    implementation: AssumePermissionsPresenterImpl,
    dependencies: [
        AssumePermissionsContext,
        AssumePermissionsUseCase,
        ListAssumableTargetsUseCase,
        IdentityContext,
        FeatureFlagsService
    ]
});
