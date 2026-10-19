import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { PickerOptionIcon } from "~/components/picker/PickerOptionIcon.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { SEARCH_DEBOUNCE_MS } from "~/editor/presentation/editor/constants.js";
import { USER_SEARCH_LIMIT } from "~/editor/presentation/editor/constants.js";
import { WorkflowEditorToasts } from "~/editor/toasts/WorkflowEditorToasts.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { normaliseReason } from "~/settings/model/list/normaliseReason.js";
import { upsertExclusion } from "~/settings/model/list/upsertExclusion.js";
import { getLocalDate } from "~/settings/model/time/getLocalDate.js";
import { getTodayLocalDate } from "~/settings/model/time/getTodayLocalDate.js";
import { isExclusionActive } from "~/settings/model/time/isExclusionActive.js";
import { isPastDate } from "~/settings/model/time/isPastDate.js";
import { resolveEndsOn } from "~/settings/model/time/resolveEndsOn.js";
import { toLocalMidnight } from "~/settings/model/time/toLocalMidnight.js";
import type { ExclusionUserName } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { getExclusionSaveError } from "~/settings/presentation/getExclusionSaveError.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/WorkflowSettingsUseCases.js";
import { ExclusionDialogPresenter as Abstraction } from "./abstractions.js";
import type { ExclusionDialogInitParams } from "./abstractions.js";
import type { ExclusionDialogMode } from "./abstractions.js";
import type { ExclusionDialogNoteVm } from "./abstractions.js";
import type { ExclusionDialogUserVm } from "./abstractions.js";
import { toExclusionUserOption } from "./toExclusionUserOption.js";

const ADD_EXCLUSION = "Add exclusion";
const EDIT_EXCLUSION = "Edit exclusion";
const SAVE = "Save";
const SAVING = "Saving…";
const CHOOSE_USER = "Choose a user.";
const PAST_DATE = "Pick today or a later date.";
const USERS_FAILED = "Could not load users.";
const EXPIRED_NOTE =
    "This exclusion has expired. Keep the date to change only the reason, or pick a new date to make it active again.";
const DELETED_USER_NOTE = "This user was deleted, so the entry has no effect. Remove it.";
const ADDED_TOAST = "Exclusion added";
const UPDATED_TOAST = "Exclusion updated";

const formatDateHint = (timeZone: string): string => {
    return `Optional. The exclusion ends at the end of that day (${timeZone}). Leave empty to keep it until you remove it.`;
};

// The locked User field of the Edit dialog: the page's name, muted with `person_off` when deleted (QBZ-91).
const toLockedUserOption = (name: ExclusionUserName): PickerOption => {
    const deleted = name.state === "deleted";
    let icon: PickerOptionIcon = "person";
    if (deleted) {
        icon = "person_off";
    }
    return {
        id: name.userId,
        label: name.label,
        description: null,
        warning: null,
        muted: deleted,
        disabled: false,
        icon,
        note: null
    };
};

/*
 * The Add and Edit exclusion dialog (R318, R319, R324, R325, R327): builds the whole list from the
 * page's last-loaded list with exactly one change, saves it, and hands the server's record back.
 */
class ExclusionDialogPresenterImpl implements Abstraction.Interface {
    private source: ExclusionsSource | null = null;
    private mode: ExclusionDialogMode = "add";
    private timeZone = "UTC";
    private userId: string | null = null;
    // The user picked in Add, handed to the page with the saved record.
    private pickedUser: WorkflowUserSummary | null = null;
    // The entry Edit opened, and its local date when the dialog opened.
    private original: WorkflowExclusion | null = null;
    private originalDate: string | null = null;
    private expiredAtOpen = false;
    private reason = "";
    private date: string | null = null;
    private userError: string | null = null;
    private alert: string | null = null;
    private saving = false;
    private results: WorkflowUserSummary[] = [];
    private searchFailed = false;
    // Every init and dispose starts a new run; a save of an older run touches nothing.
    private runToken = 0;
    private searchToken = 0;
    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private settings: WorkflowSettingsUseCases.Interface,
        private config: WorkflowConfigUseCases.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
        makeAutoObservable<
            ExclusionDialogPresenterImpl,
            | "settings"
            | "config"
            | "toasts"
            | "source"
            | "pickedUser"
            | "original"
            | "results"
            | "runToken"
            | "searchToken"
            | "searchTimer"
        >(this, {
            settings: false,
            config: false,
            toasts: false,
            source: observableRef,
            pickedUser: observableRef,
            original: observableRef,
            results: observableRef,
            runToken: false,
            searchToken: false,
            searchTimer: false
        });
    }

    get vm(): Abstraction.ViewModel {
        const now = Date.now();
        const today = getTodayLocalDate(now, this.timeZone);
        // The earliest pickable day: today in the viewer's zone, as a local midnight (R337).
        const minDate = toLocalMidnight(today);
        return {
            title: this.mode === "add" ? ADD_EXCLUSION : EDIT_EXCLUSION,
            user: this.buildUserVm(),
            reason: this.reason,
            date: this.date,
            minDate,
            dateError: this.getDateError(today),
            dateHint: formatDateHint(this.timeZone),
            showClear: this.date !== null,
            note: this.buildNote(),
            alert: this.alert,
            confirmLabel: this.getConfirmLabel(),
            saving: this.saving
        };
    }

    init(params: ExclusionDialogInitParams): void {
        this.dispose();
        this.source = params.source;
        this.mode = params.mode;
        this.timeZone = params.source.getTimeZone();
        if (params.mode === "edit") {
            this.openEntry(params.userId);
            return;
        }
        this.searchUsers("");
    }

    searchUsers(search: string): void {
        if (this.mode !== "add") {
            return;
        }
        this.cancelSearchTimer();
        if (search === "") {
            void this.runUserSearch(search);
            return;
        }
        this.searchTimer = setTimeout(() => {
            this.searchTimer = null;
            void this.runUserSearch(search);
        }, SEARCH_DEBOUNCE_MS);
    }

    // Every field is frozen while saving, so a failed save shows only what was sent (R325).
    setUser(userId: string | null): void {
        if (this.mode !== "add" || this.saving) {
            return;
        }
        if (userId === null) {
            this.userId = null;
            this.pickedUser = null;
            return;
        }
        const user = this.results.find(item => item.id === userId);
        // A user in the list is disabled in the picker (Q64), so a pick of one is ignored.
        if (user === undefined || this.isListed(userId)) {
            return;
        }
        this.userId = userId;
        this.pickedUser = user;
        this.userError = null;
    }

    setReason(reason: string): void {
        if (this.saving) {
            return;
        }
        this.reason = reason;
    }

    setDate(date: string | null): void {
        if (this.saving) {
            return;
        }
        if (date === "") {
            this.date = null;
            return;
        }
        this.date = date;
    }

    clearDate(): void {
        if (this.saving) {
            return;
        }
        this.date = null;
    }

    async submit(): Promise<void> {
        const source = this.source;
        if (source === null || this.saving) {
            return;
        }
        // The next submit clears the alert; editing a field does not (R325).
        this.alert = null;
        const userId = this.userId;
        if (userId === null) {
            this.userError = CHOOSE_USER;
            return;
        }
        const now = Date.now();
        const today = getTodayLocalDate(now, this.timeZone);
        if (this.getDateError(today) !== null) {
            return;
        }

        let originalEndsOn: string | null = null;
        if (this.original !== null) {
            originalEndsOn = this.original.endsOn;
        }
        const endsOn = resolveEndsOn({
            pickedDate: this.date,
            originalDate: this.originalDate,
            originalEndsOn,
            timeZone: this.timeZone
        });
        const reason = normaliseReason(this.reason);
        const entry: WorkflowExclusion = { userId, reason, endsOn };
        // The whole list from the last load plus exactly this change (R318, D106).
        const list = source.getExclusions();
        const exclusions = upsertExclusion(list, entry);
        const change = this.mode;
        const user = this.pickedUser;
        const toast = change === "add" ? ADDED_TOAST : UPDATED_TOAST;
        const token = this.runToken;
        this.saving = true;

        let saved: WorkflowSettings;
        try {
            saved = await this.settings.updateSettings({ exclusions });
        } catch (error) {
            if (token === this.runToken) {
                this.applyFailure(error);
            }
            return;
        }
        if (token !== this.runToken) {
            return;
        }
        this.endSaving();
        this.toasts.success(toast);
        source.applySaved({ settings: saved, change, user });
        source.closeDialog();
    }

    removeEntry(): void {
        if (this.saving || this.mode !== "edit") {
            return;
        }
        const source = this.source;
        const userId = this.userId;
        if (source === null || userId === null) {
            return;
        }
        source.openRemove(userId);
    }

    cancel(): void {
        // Cancel, close and Escape do nothing while saving (R325).
        if (this.saving) {
            return;
        }
        const source = this.source;
        if (source === null) {
            return;
        }
        source.closeDialog();
    }

    dispose(): void {
        this.runToken += 1;
        this.searchToken += 1;
        this.cancelSearchTimer();
        this.source = null;
        this.mode = "add";
        this.timeZone = "UTC";
        this.userId = null;
        this.pickedUser = null;
        this.original = null;
        this.originalDate = null;
        this.expiredAtOpen = false;
        this.reason = "";
        this.date = null;
        this.userError = null;
        this.alert = null;
        this.saving = false;
        this.results = [];
        this.searchFailed = false;
    }

    private openEntry(userId: string | null): void {
        const source = this.source;
        if (source === null || userId === null) {
            return;
        }
        const entry = source.getExclusions().find(item => item.userId === userId);
        if (entry === undefined) {
            return;
        }
        this.original = entry;
        this.userId = entry.userId;
        this.reason = entry.reason ?? "";
        let originalDate: string | null = null;
        if (entry.endsOn !== null) {
            originalDate = getLocalDate(entry.endsOn, this.timeZone);
        }
        this.originalDate = originalDate;
        this.date = originalDate;
        const now = Date.now();
        // The expired note belongs to an entry that had expired when the dialog opened (R324).
        this.expiredAtOpen = !isExclusionActive(entry, now);
    }

    private isListed(userId: string): boolean {
        const source = this.source;
        if (source === null) {
            return false;
        }
        return source.getExclusions().some(item => item.userId === userId);
    }

    // Only a changed date can be in the past: an unchanged expired date stays allowed (QBZ-30).
    private getDateError(today: string): string | null {
        const date = this.date;
        if (date === null || date === this.originalDate) {
            return null;
        }
        if (!isPastDate(date, today)) {
            return null;
        }
        return PAST_DATE;
    }

    private buildUserVm(): ExclusionDialogUserVm {
        const source = this.source;
        if (this.mode === "edit") {
            let selected: PickerOption | null = null;
            if (source !== null && this.userId !== null) {
                const name = source.getUserName(this.userId);
                selected = toLockedUserOption(name);
            }
            return { value: this.userId, selected, options: [], locked: true, error: null };
        }

        const listed = new Set<string>();
        if (source !== null) {
            for (const exclusion of source.getExclusions()) {
                listed.add(exclusion.userId);
            }
        }
        const options = this.results.map(user => {
            const inList = listed.has(user.id);
            return toExclusionUserOption(user, inList);
        });
        let selected: PickerOption | null = null;
        if (this.pickedUser !== null) {
            selected = toExclusionUserOption(this.pickedUser, false);
        }
        let error = this.userError;
        if (error === null && this.searchFailed) {
            error = USERS_FAILED;
        }
        return { value: this.userId, selected, options, locked: false, error };
    }

    // One note slot: a deleted user's note wins over the expired note (R324).
    private buildNote(): ExclusionDialogNoteVm | null {
        const source = this.source;
        if (this.mode !== "edit" || source === null || this.userId === null) {
            return null;
        }
        const name = source.getUserName(this.userId);
        if (name.state === "deleted") {
            return { kind: "deletedUser", text: DELETED_USER_NOTE };
        }
        if (this.expiredAtOpen) {
            return { kind: "expired", text: EXPIRED_NOTE };
        }
        return null;
    }

    private getConfirmLabel(): string {
        if (this.saving) {
            return SAVING;
        }
        if (this.mode === "add") {
            return ADD_EXCLUSION;
        }
        return SAVE;
    }

    private async runUserSearch(search: string): Promise<void> {
        this.searchToken += 1;
        const token = this.searchToken;
        this.searchFailed = false;
        let query: string | null = null;
        if (search !== "") {
            query = search;
        }
        try {
            const result = await this.config.listUsers({
                search: query,
                ids: null,
                teamIds: null,
                limit: USER_SEARCH_LIMIT
            });
            if (token === this.searchToken) {
                this.applyResults(result.users);
            }
        } catch {
            if (token === this.searchToken) {
                this.applySearchFailure();
            }
        }
    }

    private applyResults(users: WorkflowUserSummary[]): void {
        this.results = users;
        this.searchFailed = false;
    }

    private applySearchFailure(): void {
        // The next search retries (R325).
        this.searchFailed = true;
    }

    private applyFailure(error: unknown): void {
        // The dialog stays open with every entered value (R325, QBZ-37).
        this.saving = false;
        this.alert = getExclusionSaveError(error);
    }

    private endSaving(): void {
        this.saving = false;
    }

    private cancelSearchTimer(): void {
        if (this.searchTimer !== null) {
            clearTimeout(this.searchTimer);
            this.searchTimer = null;
        }
    }
}

export const ExclusionDialogPresenter = Abstraction.createImplementation({
    implementation: ExclusionDialogPresenterImpl,
    dependencies: [WorkflowSettingsUseCases, WorkflowConfigUseCases, WorkflowEditorToasts]
});
