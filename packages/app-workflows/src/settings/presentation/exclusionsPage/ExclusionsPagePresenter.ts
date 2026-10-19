import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { PickerOptionIcon } from "~/components/picker/PickerOptionIcon.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import { chunkIds } from "~/editor/presentation/editor/chunkIds.js";
import { USER_IDS_LIMIT } from "~/editor/presentation/editor/constants.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { ExclusionTab } from "~/settings/model/list/ExclusionTab.js";
import type { ExclusionsEmptyVm } from "~/settings/model/list/ExclusionsEmptyVm.js";
import { filterExclusions } from "~/settings/model/list/filterExclusions.js";
import { getExclusionsEmptyState } from "~/settings/model/list/getExclusionsEmptyState.js";
import { searchFilterOptions } from "~/settings/model/list/searchFilterOptions.js";
import { sortExclusions } from "~/settings/model/list/sortExclusions.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/WorkflowSettingsUseCases.js";
import { ExclusionsPagePresenter as Abstraction } from "./abstractions.js";
import type { ExclusionDialogRequest } from "./abstractions.js";
import type { ExclusionFilterVm } from "./abstractions.js";
import type { ExclusionRowVm } from "./abstractions.js";
import type { ExclusionTabVm } from "./abstractions.js";
import type { ExclusionsPageInitParams } from "./abstractions.js";
import type { ExclusionsPageStatus } from "./abstractions.js";
import type { ApplySavedParams } from "./ExclusionsSource.js";
import type { ExclusionUserName } from "./ExclusionsSource.js";
import { buildExclusionRowVm } from "./buildExclusionRowVm.js";
import { collectNameLookupIds } from "./collectNameLookupIds.js";
import { mergeUserNames } from "./mergeUserNames.js";

const TABS: ExclusionTabVm[] = [
    { id: "active", label: "Active" },
    { id: "expired", label: "Expired" },
    { id: "all", label: "All" }
];

// A user the page has no name for yet: the row shows the raw id (R321).
const toUnknownName = (userId: string): ExclusionUserName => {
    return { userId, label: userId, state: "unknown" };
};

/*
 * A user of the list as an option of `Filter by user` (R332): a deleted or unresolved user carries
 * the raw id as its description, so several `Deleted user` options can be told apart.
 */
const toFilterOption = (name: ExclusionUserName): PickerOption => {
    let description: string | null = null;
    if (name.state !== "found") {
        description = name.userId;
    }
    let icon: PickerOptionIcon = "person";
    if (name.state === "deleted") {
        icon = "person_off";
    }
    return {
        id: name.userId,
        label: name.label,
        description,
        warning: null,
        muted: name.state === "deleted",
        disabled: false,
        icon,
        note: null
    };
};

const isNotAuthorized = (error: unknown): boolean => {
    if (!(error instanceof GraphQLOperationError)) {
        return false;
    }
    return error.code === SettingsErrorCode.NotAuthorized;
};

/*
 * The Reviewer exclusions page (R318, R322, R329): loads the whole list once the viewer may manage
 * it, keeps it as the last-loaded list, and builds the rows, tabs, filter and empty states. The
 * dialogs read and write through it as their `ExclusionsSource`.
 */
class ExclusionsPagePresenterImpl implements Abstraction.Interface {
    private canManage = false;
    private timeZone = "UTC";
    private status: ExclusionsPageStatus = "loading";
    // The list from the last load or the last successful save (R318).
    private exclusions: WorkflowExclusion[] = [];
    private names = new Map<string, ExclusionUserName>();
    private namesFailed = false;
    private tab: ExclusionTab = "active";
    private userFilter: string | null = null;
    private filterSearch = "";
    private dialog: ExclusionDialogRequest | null = null;
    // Every load and dispose starts a new one; an older answer is dropped.
    private loadToken = 0;
    // Every name lookup, load and dispose starts a new one; an older lookup's answer is dropped (R321).
    private namesToken = 0;

    constructor(
        private settingsUseCases: WorkflowSettingsUseCases.Interface,
        private config: WorkflowConfigUseCases.Interface
    ) {
        makeAutoObservable<
            ExclusionsPagePresenterImpl,
            | "settingsUseCases"
            | "config"
            | "exclusions"
            | "names"
            | "dialog"
            | "loadToken"
            | "namesToken"
        >(this, {
            settingsUseCases: false,
            config: false,
            exclusions: observableRef,
            names: observableRef,
            dialog: observableRef,
            loadToken: false,
            namesToken: false
        });
    }

    get vm(): Abstraction.ViewModel {
        // The status is computed for the moment the view model is read; the page does not tick (R319).
        const now = Date.now();
        const rows = this.buildRows(now);
        return {
            status: this.status,
            canAdd: this.canManage && this.status === "ready",
            tab: this.tab,
            tabs: TABS,
            filter: this.buildFilter(),
            rows,
            empty: this.buildEmpty(rows.length),
            namesFailed: this.namesFailed,
            dialog: this.dialog
        };
    }

    async init(params: ExclusionsPageInitParams): Promise<void> {
        this.dispose();
        this.canManage = params.canManage;
        this.timeZone = params.timeZone;
        if (!params.canManage) {
            this.status = "noAccess";
            return;
        }
        await this.load();
    }

    async reload(): Promise<void> {
        if (!this.canManage) {
            return;
        }
        await this.load();
    }

    async retryNames(): Promise<void> {
        if (this.status !== "ready") {
            return;
        }
        await this.resolveNames();
    }

    setTab(tab: ExclusionTab): void {
        this.tab = tab;
    }

    setUserFilter(userId: string | null): void {
        this.userFilter = userId;
        this.filterSearch = "";
    }

    searchUserFilter(search: string): void {
        this.filterSearch = search;
    }

    openAdd(): void {
        // Nothing opens before a list is loaded: a save from an unloaded list would wipe the record (R329).
        if (this.status !== "ready") {
            return;
        }
        this.dialog = { kind: "add", userId: null };
    }

    openEdit(userId: string): void {
        if (!this.canOpen(userId)) {
            return;
        }
        this.dialog = { kind: "edit", userId };
    }

    openRemove(userId: string): void {
        if (!this.canOpen(userId)) {
            return;
        }
        this.dialog = { kind: "remove", userId };
    }

    closeDialog(): void {
        this.dialog = null;
    }

    getExclusions(): WorkflowExclusion[] {
        return this.exclusions;
    }

    getTimeZone(): string {
        return this.timeZone;
    }

    getUserName(userId: string): ExclusionUserName {
        const known = this.names.get(userId);
        if (known !== undefined) {
            return known;
        }
        return toUnknownName(userId);
    }

    applySaved(params: ApplySavedParams): void {
        this.exclusions = params.settings.exclusions;
        const user = params.user;
        if (user !== null) {
            const names = new Map(this.names);
            names.set(user.id, { userId: user.id, label: user.displayName, state: "found" });
            this.names = names;
        }
        // After an add the new entry is active, so the Active tab shows it (Q66).
        if (params.change === "add") {
            this.tab = "active";
        }
        this.dropStaleFilter();
        // Names only for ids the saved record brings that the page does not know yet (R318).
        void this.resolveNames();
    }

    dispose(): void {
        this.loadToken += 1;
        this.namesToken += 1;
        this.canManage = false;
        this.timeZone = "UTC";
        this.status = "loading";
        this.exclusions = [];
        this.names = new Map();
        this.namesFailed = false;
        this.tab = "active";
        this.userFilter = null;
        this.filterSearch = "";
        this.dialog = null;
    }

    private async load(): Promise<void> {
        this.loadToken += 1;
        // A lookup of an earlier list is dropped; the new list starts its own.
        this.namesToken += 1;
        const token = this.loadToken;
        this.status = "loading";
        this.dialog = null;
        let settings: WorkflowSettings;
        try {
            settings = await this.settingsUseCases.getSettings();
        } catch (error) {
            if (token === this.loadToken) {
                this.applyLoadFailure(error);
            }
            return;
        }
        if (token !== this.loadToken) {
            return;
        }
        this.applyLoaded(settings);
        await this.resolveNames();
    }

    /*
     * Names the users of the list (R321): the ids without a name, in chunks of 200, concurrently.
     * A failed chunk leaves its ids unknown and shows the banner; `NotAuthorized` shows no access.
     */
    private async resolveNames(): Promise<void> {
        const ids = collectNameLookupIds(this.exclusions, this.names);
        this.namesToken += 1;
        const token = this.namesToken;
        if (ids.length === 0) {
            this.namesFailed = false;
            return;
        }
        const chunks = chunkIds(ids, USER_IDS_LIMIT);
        const calls = chunks.map(chunk => {
            // A synchronous throw of the call becomes a rejection, which allSettled catches.
            return Promise.resolve().then(() => {
                return this.config.listUsers({
                    search: null,
                    ids: chunk,
                    teamIds: null,
                    limit: null
                });
            });
        });
        const answers = await Promise.allSettled(calls);
        if (token !== this.namesToken) {
            return;
        }
        this.applyNameAnswers(answers);
    }

    private applyNameAnswers(answers: PromiseSettledResult<WorkflowUserList>[]): void {
        let names = this.names;
        let failed = false;
        for (const answer of answers) {
            if (answer.status === "fulfilled") {
                names = mergeUserNames(names, answer.value);
                continue;
            }
            if (isNotAuthorized(answer.reason)) {
                this.status = "noAccess";
                this.dialog = null;
                return;
            }
            failed = true;
        }
        this.names = names;
        this.namesFailed = failed;
    }

    private applyLoaded(settings: WorkflowSettings): void {
        this.exclusions = settings.exclusions;
        this.status = "ready";
        this.dropStaleFilter();
    }

    private applyLoadFailure(error: unknown): void {
        if (isNotAuthorized(error)) {
            this.status = "noAccess";
            return;
        }
        // A transport failure and any other server error show the same load error (Copy gap 3).
        this.status = "failed";
    }

    // A filter whose user is no longer in the list shows all users again (R322).
    private dropStaleFilter(): void {
        const filter = this.userFilter;
        if (filter !== null && !this.hasEntry(filter)) {
            this.userFilter = null;
        }
    }

    private hasEntry(userId: string): boolean {
        return this.exclusions.some(exclusion => exclusion.userId === userId);
    }

    private canOpen(userId: string): boolean {
        return this.status === "ready" && this.hasEntry(userId);
    }

    private buildLabels(list: WorkflowExclusion[]): Map<string, string> {
        const labels = new Map<string, string>();
        for (const exclusion of list) {
            const name = this.getUserName(exclusion.userId);
            labels.set(exclusion.userId, name.label);
        }
        return labels;
    }

    private buildRows(now: number): ExclusionRowVm[] {
        if (this.status !== "ready") {
            return [];
        }
        const filtered = filterExclusions(this.exclusions, {
            tab: this.tab,
            userId: this.userFilter,
            now
        });
        const labels = this.buildLabels(filtered);
        const sorted = sortExclusions(filtered, labels);
        return sorted.map(exclusion => {
            const name = this.getUserName(exclusion.userId);
            return buildExclusionRowVm(exclusion, name, now, this.timeZone);
        });
    }

    private buildFilter(): ExclusionFilterVm {
        if (this.status !== "ready") {
            return { value: this.userFilter, selected: null, options: [] };
        }
        const labels = this.buildLabels(this.exclusions);
        const sorted = sortExclusions(this.exclusions, labels);
        const all = sorted.map(exclusion => {
            const name = this.getUserName(exclusion.userId);
            return toFilterOption(name);
        });
        const options = searchFilterOptions(all, this.filterSearch);
        let selected: PickerOption | null = null;
        const chosen = all.find(option => option.id === this.userFilter);
        if (chosen !== undefined) {
            selected = chosen;
        }
        return { value: this.userFilter, selected, options };
    }

    private buildEmpty(rowCount: number): ExclusionsEmptyVm | null {
        if (this.status !== "ready" || rowCount > 0) {
            return null;
        }
        return getExclusionsEmptyState({
            total: this.exclusions.length,
            tab: this.tab,
            userFiltered: this.userFilter !== null
        });
    }
}

export const ExclusionsPagePresenter = Abstraction.createImplementation({
    implementation: ExclusionsPagePresenterImpl,
    dependencies: [WorkflowSettingsUseCases, WorkflowConfigUseCases]
});
