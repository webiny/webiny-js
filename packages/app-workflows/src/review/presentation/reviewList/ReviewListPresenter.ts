import { makeAutoObservable } from "mobx";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import { REVIEW_LIST_PAGE_SIZE } from "~/review/domain/constants.js";
import { getWorkflowsPermissionSet } from "~/review/domain/getWorkflowsPermissionSet.js";
import type { ReviewListRow } from "~/review/domain/types.js";
import { toReviewListRow } from "~/review/domain/toReviewListRow.js";
import type { ListReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ReviewListWhere } from "~/review/appGateway/IReviewAppGateway.js";
import { getRowStateTag } from "~/review/presentation/targetReview/getRowStateTag.js";
import type { TargetReviewActionVm } from "~/review/presentation/targetReview/abstractions.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { ReviewListPage } from "~/review/useCases/IReviewListUseCases.js";
import { ReviewListPresenter as Abstraction } from "./abstractions.js";
import type { IReviewRowProvider } from "./abstractions.js";
import type { ReviewListDialogVm } from "./abstractions.js";
import type { ReviewListEmptyVm } from "./abstractions.js";
import type { ReviewListInitParams } from "./abstractions.js";
import type { ReviewListRowVm } from "./abstractions.js";
import type { ReviewListStatus } from "./abstractions.js";
import type { ReviewListTab } from "./abstractions.js";
import { formatLastChange } from "./formatLastChange.js";
import { getDefaultReviewListSort } from "./getDefaultReviewListSort.js";
import { getListOwnerLabel } from "./getListOwnerLabel.js";
import { getListReviewStateLabel } from "./getListReviewStateLabel.js";
import { getListRowActions } from "./getListRowActions.js";
import { getReviewListEmpty } from "./getReviewListEmpty.js";
import { getVisibleReviewListTabs } from "./getVisibleReviewListTabs.js";
import { hasRowChanged } from "./hasRowChanged.js";
import { isBeyondRefetchWindow } from "./isBeyondRefetchWindow.js";
import { isReviewListTabAvailable } from "./isReviewListTabAvailable.js";
import { prefersReducedMotion } from "./prefersReducedMotion.js";
import { resolveRowBinding } from "./resolveRowBinding.js";

// The search input applies its draft after this long without typing.
const SEARCH_DEBOUNCE_MS = 300;

const NEW_REVIEWS_NOTICE = "New reviews are available.";
const LOAD_FAILED_MESSAGE = "The server did not respond. Try again in a moment.";

// The server caps a list page at 100 rows (`MAX_REVIEW_LIST_LIMIT`).
const MAX_REFRESH_LIMIT = 100;

interface ReviewListEntry {
    row: ReviewListRow;
    leaving: boolean;
    highlighted: boolean;
}

class ReviewListPresenterImpl implements Abstraction.Interface {
    private _tab: ReviewListTab = "assignedToMe";
    private _sort: ReviewListSort = "lastChangedOn_ASC";
    private _search = "";
    private _searchDraft = "";
    private _contentTypeId: string | null = null;
    private _reviewState: ReviewStateValue | null = null;
    private _stepState: StepStateValue | null = null;
    private _status: ReviewListStatus = "loading";
    private _loadingMore = false;
    private _hasMore = false;
    private _cursor: string | null = null;
    private _entries: ReviewListEntry[] = [];
    private _heldIds: string[] = [];
    private _error: string | null = null;
    private _dialog: ReviewListDialogVm | null = null;
    private useCases: IReviewListUseCases | null = null;
    private rowProvider: IReviewRowProvider | null = null;
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
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            ReviewListPresenterImpl,
            | "activity"
            | "identityContext"
            | "useCases"
            | "rowProvider"
            | "unsubscribe"
            | "loadToken"
            | "refreshingToken"
            | "refreshQueued"
            | "signalDuringLoad"
            | "searchTimer"
        >(this, {
            activity: false,
            identityContext: false,
            useCases: false,
            rowProvider: false,
            unsubscribe: false,
            loadToken: false,
            refreshingToken: false,
            refreshQueued: false,
            signalDuringLoad: false,
            searchTimer: false
        });
    }

    // The relative times are computed when the view model is read; they are as fresh as the last
    // state change (a refetch, a tab switch), which is enough for "12 min ago" granularity.
    get vm(): Abstraction.ViewModel {
        const now = new Date();
        const rows = this._entries.map(entry => this.toRowVm(entry, now));
        const visibleCount = this._entries.filter(entry => !entry.leaving).length;
        const isFiltered =
            this._search.trim() !== "" ||
            this._contentTypeId !== null ||
            this._reviewState !== null ||
            this._stepState !== null;
        const hasTeams = this.identityContext.getIdentity().teams.length > 0;
        const permissions = getWorkflowsPermissionSet(this.identityContext.getIdentity());
        const tabs = getVisibleReviewListTabs(permissions);

        let empty: ReviewListEmptyVm | null = null;
        if (this._status === "ready" && visibleCount === 0 && this._heldIds.length === 0) {
            empty = getReviewListEmpty(this._tab, isFiltered, hasTeams);
        }

        let notice: string | null = null;
        if (this._heldIds.length > 0) {
            notice = NEW_REVIEWS_NOTICE;
        }

        return {
            tab: this._tab,
            tabs,
            rows,
            status: this._status,
            loadingMore: this._loadingMore,
            hasMore: this._hasMore,
            sort: this._sort,
            search: this._search,
            searchDraft: this._searchDraft,
            contentTypeId: this._contentTypeId,
            reviewState: this._reviewState,
            stepState: this._stepState,
            notice,
            error: this._error,
            empty,
            isFiltered,
            dialog: this._dialog
        };
    }

    async init(params: ReviewListInitParams): Promise<void> {
        this.dispose();
        this.useCases = params.useCases;
        this.rowProvider = params.rowProvider;
        // A tab the viewer may not open (`?tab=failedSteps` without `reassign`) falls back to the
        // default tab, so the server's refusal is never provoked (R259).
        const permissions = getWorkflowsPermissionSet(this.identityContext.getIdentity());
        let initialTab = params.initialTab;
        if (!isReviewListTabAvailable(initialTab, permissions)) {
            initialTab = "assignedToMe";
        }
        this._tab = initialTab;
        this._sort = getDefaultReviewListSort(initialTab);
        this.unsubscribe = this.activity.subscribe(params.namespaces, () => {
            void this.refresh();
        });

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await params.useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async setTab(tab: ReviewListTab): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        const permissions = getWorkflowsPermissionSet(this.identityContext.getIdentity());
        if (!isReviewListTabAvailable(tab, permissions)) {
            return;
        }

        this._tab = tab;
        this._sort = getDefaultReviewListSort(tab);
        this.cancelSearchTimer();
        this._search = "";
        this._searchDraft = "";
        this._contentTypeId = null;
        this._reviewState = null;
        this._stepState = null;

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
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
        const useCases = this.useCases;
        if (!useCases || search === this._search) {
            return;
        }

        this._search = search;
        this._searchDraft = search;

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
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
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        this._contentTypeId = contentTypeId;

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async setReviewState(reviewState: ReviewStateValue | null): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        this._reviewState = reviewState;

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async setStepState(stepState: StepStateValue | null): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        this._stepState = stepState;

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async toggleSort(): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        if (this._sort === "lastChangedOn_ASC") {
            this._sort = "lastChangedOn_DESC";
        } else {
            this._sort = "lastChangedOn_ASC";
        }

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
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
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        this.cancelSearchTimer();
        this._search = "";
        this._searchDraft = "";
        this._contentTypeId = null;
        this._reviewState = null;
        this._stepState = null;

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
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
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        const token = this.beginLoad(true);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
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
        const useCases = this.useCases;
        if (!useCases || !this._hasMore || this._loadingMore || this._status !== "ready") {
            return;
        }

        const token = this.loadToken;
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, this._cursor);
        this._loadingMore = true;

        try {
            const listed = await useCases.listReviews(request);
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
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        // "Try again" on a failed list: a full reload with the skeleton.
        if (this._status === "failed") {
            const reloadToken = this.beginLoad(false);
            const reloadRequest = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
            try {
                const listed = await useCases.listReviews(reloadRequest);
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
        const request = this.createParams(limit, null);

        try {
            const listed = await useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyRefresh(listed);
            }
        } catch {
            // A failed background refetch keeps the visible rows; the next signal or "Show" tries again.
        }

        // A newer generation (reload, tab switch, dispose) owns the flags now.
        if (token !== this.loadToken) {
            return;
        }
        this.refreshingToken = null;
        if (this.refreshQueued) {
            this.refreshQueued = false;
            await this.refresh();
        }
    }

    removeLeavingRow(reviewId: string): void {
        this._entries = this._entries.filter(entry => {
            return !(entry.leaving && entry.row.reviewId === reviewId);
        });
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
        this.useCases = null;
        this.rowProvider = null;
        this._tab = "assignedToMe";
        this._sort = "lastChangedOn_ASC";
        this.cancelSearchTimer();
        this._search = "";
        this._searchDraft = "";
        this._contentTypeId = null;
        this._reviewState = null;
        this._stepState = null;
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
            return { row, leaving: false, highlighted: highlightNew && !known.has(row.reviewId) };
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
            added.push({ row, leaving: false, highlighted: false });
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
        this._entries.forEach(entry => {
            known.add(entry.row.reviewId);
            const updated = incomingById.get(entry.row.reviewId);
            if (updated) {
                const highlighted = hasRowChanged(entry.row, updated);
                entries.push({ row: updated, leaving: false, highlighted });
                return;
            }

            // The refetch window may not reach a row that sorts after its last row: keep it.
            const outsideWindow =
                listed.meta.hasMoreItems &&
                isBeyondRefetchWindow(entry.row, lastReturned, this._sort);
            if (outsideWindow) {
                entries.push({ row: entry.row, leaving: entry.leaving, highlighted: false });
                return;
            }
            entries.push({ row: entry.row, leaving: true, highlighted: false });
        });

        // Without a fade no transition ends, so a viewer who prefers reduced motion loses the row at once.
        let kept = entries;
        if (prefersReducedMotion()) {
            kept = entries.filter(entry => !entry.leaving);
        }

        const fresh = incoming.filter(row => !known.has(row.reviewId));
        this._entries = kept;
        this._heldIds = fresh.map(row => row.reviewId);
        this._cursor = listed.meta.cursor;
        this._hasMore = listed.meta.hasMoreItems;
        this._error = null;
    }

    private getRefreshLimit(): number {
        const loaded = this._entries.filter(entry => !entry.leaving).length;
        const window = Math.max(loaded, REVIEW_LIST_PAGE_SIZE);
        return Math.min(window, MAX_REFRESH_LIMIT);
    }

    private createParams(limit: number, after: string | null): ListReviewsParams {
        const where: ReviewListWhere = {};
        const search = this._search.trim();
        if (search) {
            where.titleContains = search;
        }
        if (this._contentTypeId) {
            where.modelId = this._contentTypeId;
        }
        if (this._tab === "myRequests") {
            if (this._reviewState) {
                where.reviewState = this._reviewState;
            }
            if (this._stepState) {
                where.stepState = this._stepState;
            }
        }
        return { list: this._tab, where, sort: this._sort, limit, after };
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
            stepStateLabel: stepStateTag.label,
            stepStateVariant: stepStateTag.variant,
            ownerLabel: getListOwnerLabel(row.owner, row.stepTitle),
            requesterName: row.requester.displayName,
            lastChange: formatLastChange(row.lastChangedOn, now),
            contentTypeLabel: resolved.contentTypeLabel,
            contentUrl: resolved.contentUrl,
            leaving: entry.leaving,
            highlighted: entry.highlighted,
            actions
        };
    }
}

export const ReviewListPresenter = Abstraction.createImplementation({
    implementation: ReviewListPresenterImpl,
    dependencies: [ReviewActivity, IdentityContext]
});
