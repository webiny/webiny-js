import { makeAutoObservable } from "mobx";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { isEmptyReviewListFilter } from "~/review/domain/isEmptyReviewListFilter.js";
import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import { REVIEW_LIST_SCOPES } from "./reviewListScopes.js";
import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewListState } from "~/review/domain/ReviewListState.js";
import { REVIEW_LIST_PAGE_SIZE } from "~/review/domain/constants.js";
import type { ReviewListRow } from "~/review/domain/types.js";
import { toReviewListRow } from "~/review/domain/toReviewListRow.js";
import { getRowStateTag } from "~/review/presentation/targetReview/getRowStateTag.js";
import type { TargetReviewActionVm } from "~/review/presentation/targetReview/abstractions.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import { WIDGET_APP_LABELS } from "~/review/presentation/widgetAppLabels.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
import { ReviewListPresenter as Abstraction } from "./abstractions.js";
import type { IReviewRowProvider } from "./abstractions.js";
import type { ReviewListDialogVm } from "./abstractions.js";
import type { ReviewListEmptyVm } from "./abstractions.js";
import type { ReviewListInitParams } from "./abstractions.js";
import type { ReviewListRowVm } from "./abstractions.js";
import type { ReviewListSortField } from "./abstractions.js";
import type { ReviewListStatus } from "./abstractions.js";
import { formatLastChange } from "./formatLastChange.js";
import { getDefaultReviewListSort } from "./getDefaultReviewListSort.js";
import { getDefaultReviewListState } from "./getDefaultReviewListState.js";
import { getListOwnerLabel } from "./getListOwnerLabel.js";
import { getListReviewStateLabel } from "./getListReviewStateLabel.js";
import { getListRowActions } from "./getListRowActions.js";
import { getReviewListEmpty } from "./getReviewListEmpty.js";
import { getReviewListStates } from "./getReviewListStates.js";
import { hasRowChanged } from "./hasRowChanged.js";
import { isBeyondRefetchWindow } from "./isBeyondRefetchWindow.js";
import { resolveRowBinding } from "./resolveRowBinding.js";
import { toggleReviewListSort } from "./toggleReviewListSort.js";

// The search input applies its draft after this long without typing.
const SEARCH_DEBOUNCE_MS = 300;

const NEW_REVIEWS_NOTICE = "New reviews are available.";
const LOAD_FAILED_MESSAGE = "The server did not respond. Try again in a moment.";

// The server caps a list page at 100 rows (`MAX_REVIEW_LIST_LIMIT`).
const MAX_REFRESH_LIMIT = 100;

interface ReviewListEntry {
    row: ReviewListRow;
    highlighted: boolean;
}

class ReviewListPresenterImpl implements Abstraction.Interface {
    private _scope: ReviewListScope = "assignedToMe";
    private _state: ReviewListState = "inReview";
    private _sort: ReviewListSort = "lastChangedOn_ASC";
    private _search = "";
    private _searchDraft = "";
    private _contentTypeId: string | null = null;
    private _status: ReviewListStatus = "loading";
    private _loadingMore = false;
    private _hasMore = false;
    private _cursor: string | null = null;
    private _entries: ReviewListEntry[] = [];
    private _heldIds: string[] = [];
    private _error: string | null = null;
    private _dialog: ReviewListDialogVm | null = null;
    // The app the list was opened for; the list use case routes by it (R348).
    private app: WorkflowAppKind | null = null;
    private rowProvider: IReviewRowProvider | null = null;
    private showContentType = false;
    private unsubscribe: (() => void) | null = null;
    // A generation: every load, reload and dispose starts a new one, and a response of an older
    // generation is ignored. An in-flight refetch only counts for the generation it started in.
    private loadToken = 0;
    private refreshingToken: number | null = null;
    private refreshQueued = false;
    // A live signal that arrived while a first-page load was in flight; consumed once it applies.
    private signalDuringLoad = false;
    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private listReviewsUseCase: ListReviewsUseCase.Interface,
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            ReviewListPresenterImpl,
            | "listReviewsUseCase"
            | "activity"
            | "identityContext"
            | "app"
            | "rowProvider"
            | "showContentType"
            | "unsubscribe"
            | "loadToken"
            | "refreshingToken"
            | "refreshQueued"
            | "signalDuringLoad"
            | "searchTimer"
        >(this, {
            listReviewsUseCase: false,
            activity: false,
            identityContext: false,
            app: false,
            rowProvider: false,
            showContentType: false,
            unsubscribe: false,
            loadToken: false,
            refreshingToken: false,
            refreshQueued: false,
            signalDuringLoad: false,
            searchTimer: false
        });
    }

    // The relative times are computed when the view model is read; they are as fresh as the last
    // state change (a refetch, a scope switch), which is enough for "12 min ago" granularity.
    get vm(): Abstraction.ViewModel {
        const now = new Date();
        const rows = this._entries.map(entry => this.toRowVm(entry, now));
        const hasFilters = this._search.trim() !== "" || this._contentTypeId !== null;
        const isFiltered = hasFilters || this._state !== getDefaultReviewListState(this._scope);
        const hasTeams = this.identityContext.getIdentity().teams.length > 0;

        let empty: ReviewListEmptyVm | null = null;
        if (this._status === "ready" && this._entries.length === 0 && this._heldIds.length === 0) {
            empty = getReviewListEmpty({
                scope: this._scope,
                state: this._state,
                hasFilters,
                hasTeams,
                showContentType: this.showContentType,
                appLabel: this.app ? WIDGET_APP_LABELS[this.app] : ""
            });
        }

        let notice: string | null = null;
        if (this._heldIds.length > 0) {
            notice = NEW_REVIEWS_NOTICE;
        }

        return {
            scope: this._scope,
            scopes: REVIEW_LIST_SCOPES,
            state: this._state,
            states: getReviewListStates(this._scope),
            rows,
            status: this._status,
            loadingMore: this._loadingMore,
            hasMore: this._hasMore,
            sort: this._sort,
            search: this._search,
            searchDraft: this._searchDraft,
            contentTypeId: this._contentTypeId,
            notice,
            error: this._error,
            empty,
            isFiltered,
            dialog: this._dialog
        };
    }

    async init(params: ReviewListInitParams): Promise<void> {
        this.dispose();
        this.app = params.app;
        this.rowProvider = params.rowProvider;
        this.showContentType = params.showContentType;
        // Every scope is open to every viewer (designer answer B7); the server decides what it
        // lists. A missing state, or one empty by definition for the scope, falls back to the
        // scope's default state.
        const scope: ReviewListScope = params.initialScope ?? "assignedToMe";
        let state = params.initialState ?? getDefaultReviewListState(scope);
        if (isEmptyReviewListFilter(scope, state)) {
            state = getDefaultReviewListState(scope);
        }
        this._scope = scope;
        this._state = state;
        this._sort = getDefaultReviewListSort(scope, state);
        this.unsubscribe = this.activity.subscribe(params.namespaces, () => {
            void this.refresh();
        });

        const token = this.beginLoad(false);
        const request = this.createParams(params.app, REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await this.listReviewsUseCase.execute(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async setScope(scope: ReviewListScope): Promise<void> {
        const app = this.app;
        if (!app) {
            return;
        }

        // The state is kept unless the pair is empty by definition (B2 design 1). The search and
        // the content model filter are kept; paging and the sort reset to the scope's (B11).
        this._scope = scope;
        if (isEmptyReviewListFilter(scope, this._state)) {
            this._state = getDefaultReviewListState(scope);
        }
        this._sort = getDefaultReviewListSort(scope, this._state);

        const token = this.beginLoad(false);
        const request = this.createParams(app, REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await this.listReviewsUseCase.execute(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    setSearchDraft(search: string): void {
        this.cancelSearchTimer();
        this._searchDraft = search;
        if (search === this._search) {
            return;
        }
        this.searchTimer = setTimeout(() => {
            this.searchTimer = null;
            void this.setSearch(search);
        }, SEARCH_DEBOUNCE_MS);
    }

    async setSearch(search: string): Promise<void> {
        const app = this.app;
        if (!app || search === this._search) {
            return;
        }

        this._search = search;
        this._searchDraft = search;

        const token = this.beginLoad(false);
        const request = this.createParams(app, REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await this.listReviewsUseCase.execute(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async setContentType(contentTypeId: string | null): Promise<void> {
        const app = this.app;
        if (!app) {
            return;
        }

        this._contentTypeId = contentTypeId;

        const token = this.beginLoad(false);
        const request = this.createParams(app, REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await this.listReviewsUseCase.execute(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async setState(state: ReviewListState): Promise<void> {
        const app = this.app;
        if (!app || isEmptyReviewListFilter(this._scope, state)) {
            return;
        }

        this._state = state;
        this._sort = getDefaultReviewListSort(this._scope, state);

        const token = this.beginLoad(false);
        const request = this.createParams(app, REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await this.listReviewsUseCase.execute(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async toggleSort(field: ReviewListSortField): Promise<void> {
        const app = this.app;
        if (!app) {
            return;
        }

        this._sort = toggleReviewListSort(this._sort, field);

        const token = this.beginLoad(false);
        const request = this.createParams(app, REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await this.listReviewsUseCase.execute(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async clearFilters(): Promise<void> {
        const app = this.app;
        if (!app) {
            return;
        }

        this.cancelSearchTimer();
        this._search = "";
        this._searchDraft = "";
        this._contentTypeId = null;
        this._state = getDefaultReviewListState(this._scope);
        this._sort = getDefaultReviewListSort(this._scope, this._state);

        const token = this.beginLoad(false);
        const request = this.createParams(app, REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await this.listReviewsUseCase.execute(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async reload(): Promise<void> {
        const app = this.app;
        if (!app) {
            return;
        }

        // The toolbar's Refresh (B13): the first page again with every choice kept.
        const token = this.beginLoad(false);
        const request = this.createParams(app, REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await this.listReviewsUseCase.execute(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async showNewReviews(): Promise<void> {
        const app = this.app;
        if (!app) {
            return;
        }

        const token = this.beginLoad(true);
        const request = this.createParams(app, REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await this.listReviewsUseCase.execute(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, true);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyKeepRowsFailure();
            }
        }
    }

    async loadMore(): Promise<void> {
        const app = this.app;
        if (!app || !this._hasMore || this._loadingMore || this._status !== "ready") {
            return;
        }

        const token = this.loadToken;
        const request = this.createParams(app, REVIEW_LIST_PAGE_SIZE, this._cursor);
        this._loadingMore = true;

        try {
            const listed = await this.listReviewsUseCase.execute(request);
            if (token === this.loadToken) {
                this.applyMorePage(listed);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyMoreFailure();
            }
        }
    }

    async refresh(): Promise<void> {
        const app = this.app;
        if (!app) {
            return;
        }

        // "Try again" on a failed list: a full reload with the skeleton.
        if (this._status === "failed") {
            const reloadToken = this.beginLoad(false);
            const reloadRequest = this.createParams(app, REVIEW_LIST_PAGE_SIZE, null);
            try {
                const listed = await this.listReviewsUseCase.execute(reloadRequest);
                if (reloadToken === this.loadToken) {
                    this.applyFirstPage(listed, false);
                }
            } catch {
                if (reloadToken === this.loadToken) {
                    this.applyLoadFailure();
                }
            }
            return;
        }

        if (this._status === "loading") {
            this.signalDuringLoad = true;
            return;
        }
        if (this._status !== "ready") {
            return;
        }
        if (this.refreshingToken === this.loadToken) {
            this.refreshQueued = true;
            return;
        }

        const token = this.loadToken;
        this.refreshingToken = token;
        const limit = this.getRefreshLimit();
        const request = this.createParams(app, limit, null);

        try {
            const listed = await this.listReviewsUseCase.execute(request);
            if (token === this.loadToken) {
                this.applyRefresh(listed);
            }
        } catch {
            // A failed background refetch keeps the visible rows; the next signal or "Show" tries again.
        }

        // A newer generation (reload, scope switch, dispose) owns the flags now.
        if (token !== this.loadToken) {
            return;
        }
        this.refreshingToken = null;
        if (this.refreshQueued) {
            this.refreshQueued = false;
            await this.refresh();
        }
    }

    openRowAction(
        reviewId: string,
        kind: TargetReviewActionVm["kind"],
        stepId: string | null
    ): void {
        if (kind === "request") {
            return;
        }
        const entry = this._entries.find(item => item.row.reviewId === reviewId);
        if (!entry) {
            return;
        }
        this._dialog = { kind, namespace: entry.row.namespace, reviewId, stepId };
    }

    openDetails(reviewId: string): void {
        const entry = this._entries.find(item => item.row.reviewId === reviewId);
        if (!entry) {
            return;
        }
        this._dialog = {
            kind: "details",
            namespace: entry.row.namespace,
            reviewId,
            stepId: null
        };
    }

    closeDialog(): void {
        this._dialog = null;
    }

    actionDone(): void {
        const dialog = this._dialog;
        this._dialog = null;
        if (!dialog) {
            return;
        }
        this.activity.notify({
            namespace: dialog.namespace,
            source: "own",
            reviewId: dialog.reviewId,
            targetRevisionId: null
        });
    }

    dispose(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.loadToken += 1;
        this.refreshingToken = null;
        this.refreshQueued = false;
        this.signalDuringLoad = false;
        this.app = null;
        this.rowProvider = null;
        this._scope = "assignedToMe";
        this._state = "inReview";
        this._sort = "lastChangedOn_ASC";
        this.cancelSearchTimer();
        this._search = "";
        this._searchDraft = "";
        this._contentTypeId = null;
        this._status = "loading";
        this._loadingMore = false;
        this._hasMore = false;
        this._cursor = null;
        this._entries = [];
        this._heldIds = [];
        this._error = null;
        this._dialog = null;
    }

    private cancelSearchTimer(): void {
        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
            this.searchTimer = null;
        }
    }

    // Starts a new generation and resets what a first-page load replaces. `keepRows` keeps the
    // rows on screen (used by "Show").
    private beginLoad(keepRows: boolean): number {
        this.loadToken += 1;
        this.refreshQueued = false;
        this.signalDuringLoad = false;
        this._error = null;
        this._loadingMore = false;
        if (!keepRows) {
            this._status = "loading";
            this._entries = [];
            this._heldIds = [];
            this._hasMore = false;
            this._cursor = null;
        }
        return this.loadToken;
    }

    private applyFirstPage(listed: ReviewListPage, highlightNew: boolean): void {
        const knownIds = this._entries.map(entry => entry.row.reviewId);
        const known = new Set<string>(knownIds);
        this._entries = listed.items.map(item => {
            const row = toReviewListRow(item);
            return { row, highlighted: highlightNew && !known.has(row.reviewId) };
        });
        this._heldIds = [];
        this._cursor = listed.meta.cursor;
        this._hasMore = listed.meta.hasMoreItems;
        this._error = null;
        this._status = "ready";
        this.consumeSignalDuringLoad();
    }

    // A signal that arrived during the load is answered by one refetch now that the rows exist.
    private consumeSignalDuringLoad(): void {
        if (!this.signalDuringLoad) {
            return;
        }
        this.signalDuringLoad = false;
        void this.refresh();
    }

    // "Show" failed: the rows stay on screen, only the message is added.
    private applyKeepRowsFailure(): void {
        this._error = LOAD_FAILED_MESSAGE;
    }

    private applyLoadFailure(): void {
        this.signalDuringLoad = false;
        this._entries = [];
        this._heldIds = [];
        this._hasMore = false;
        this._error = LOAD_FAILED_MESSAGE;
        this._status = "failed";
    }

    private applyMorePage(listed: ReviewListPage): void {
        const knownIds = this._entries.map(entry => entry.row.reviewId);
        const known = new Set<string>(knownIds);
        const added: ReviewListEntry[] = [];
        listed.items.forEach(item => {
            const row = toReviewListRow(item);
            if (known.has(row.reviewId)) {
                return;
            }
            known.add(row.reviewId);
            added.push({ row, highlighted: false });
        });
        this._entries = [...this._entries, ...added];
        this._cursor = listed.meta.cursor;
        this._hasMore = listed.meta.hasMoreItems;
        this._loadingMore = false;
        this._error = null;
    }

    private applyMoreFailure(): void {
        this._loadingMore = false;
        this._error = LOAD_FAILED_MESSAGE;
    }

    private applyRefresh(listed: ReviewListPage): void {
        const incoming = listed.items.map(item => toReviewListRow(item));
        let lastReturned: ReviewListRow | null = null;
        if (incoming.length > 0) {
            lastReturned = incoming[incoming.length - 1];
        }
        const incomingById = new Map<string, ReviewListRow>();
        incoming.forEach(row => {
            incomingById.set(row.reviewId, row);
        });

        const known = new Set<string>();
        const entries: ReviewListEntry[] = [];
        let keptBeyondWindow = false;
        this._entries.forEach(entry => {
            known.add(entry.row.reviewId);
            const updated = incomingById.get(entry.row.reviewId);
            if (updated) {
                const highlighted = hasRowChanged(entry.row, updated);
                entries.push({ row: updated, highlighted });
                return;
            }

            // The refetch window may not reach a row that sorts after its last row: keep it.
            const outsideWindow =
                listed.meta.hasMoreItems &&
                isBeyondRefetchWindow(entry.row, lastReturned, this._sort);
            if (outsideWindow) {
                keptBeyondWindow = true;
                entries.push({ row: entry.row, highlighted: false });
                return;
            }
            // A row the server no longer lists left the list: it is dropped.
        });

        const fresh = incoming.filter(row => !known.has(row.reviewId));
        this._entries = entries;
        this._heldIds = fresh.map(row => row.reviewId);
        /*
         * The refetch cursor points after its window. It replaces the loaded one only when the
         * window covered every loaded row; with rows kept beyond it, or a "Load more" in flight
         * (which sets the cursor itself), the next page still starts after the last loaded row.
         */
        if (!keptBeyondWindow && !this._loadingMore) {
            this._cursor = listed.meta.cursor;
            this._hasMore = listed.meta.hasMoreItems;
        }
        this._error = null;
    }

    private getRefreshLimit(): number {
        const loaded = this._entries.length;
        const window = Math.max(loaded, REVIEW_LIST_PAGE_SIZE);
        return Math.min(window, MAX_REFRESH_LIMIT);
    }

    private createParams(
        app: WorkflowAppKind,
        limit: number,
        after: string | null
    ): ListReviewsUseCase.Params {
        const where: ListReviewsUseCase.Params["where"] = {};
        const search = this._search.trim();
        if (search) {
            where.titleContains = search;
        }
        if (this._contentTypeId) {
            where.modelId = this._contentTypeId;
        }
        where.state = this._state;
        return { app, scope: this._scope, where, sort: this._sort, limit, after };
    }

    private toRowVm(entry: ReviewListEntry, now: Date): ReviewListRowVm {
        const row = entry.row;
        const resolved = resolveRowBinding(this.rowProvider, row);

        let actions: TargetReviewActionVm[] = [];
        if (resolved.binding) {
            actions = getListRowActions(row);
        }

        const stepStateTag = getRowStateTag(row);

        return {
            reviewId: row.reviewId,
            namespace: row.namespace,
            title: row.title,
            reviewStateLabel: getListReviewStateLabel(row.reviewState),
            stepTitle: row.stepTitle,
            stepColor: row.stepColor,
            stepStateLabel: stepStateTag.label,
            stepStateVariant: stepStateTag.variant,
            ownerLabel: getListOwnerLabel(row.owner, row.stepTitle, row.stepState),
            requesterName: row.requester.displayName,
            lastChange: formatLastChange(row.lastChangedOn, now),
            contentTypeLabel: resolved.contentTypeLabel,
            contentTypeIcon: resolved.contentTypeIcon,
            contentTypeApp: this.app ? WIDGET_APP_LABELS[this.app] : "",
            contentUrl: resolved.contentUrl,
            highlighted: entry.highlighted,
            actions
        };
    }
}

export const ReviewListPresenter = Abstraction.createImplementation({
    implementation: ReviewListPresenterImpl,
    dependencies: [ListReviewsUseCase, ReviewActivity, IdentityContext]
});
