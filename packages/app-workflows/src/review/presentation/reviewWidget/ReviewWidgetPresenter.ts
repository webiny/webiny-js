import { makeAutoObservable } from "mobx";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import { REVIEW_WIDGET_PAGE_SIZE } from "~/review/domain/constants.js";
import type { ReviewListRow } from "~/review/domain/types.js";
import { toReviewListRow } from "~/review/domain/toReviewListRow.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import { formatLastChange } from "~/review/presentation/reviewList/formatLastChange.js";
import { getListReviewStateLabel } from "~/review/presentation/reviewList/getListReviewStateLabel.js";
import { resolveRowBinding } from "~/review/presentation/reviewList/resolveRowBinding.js";
import { getRowStateTag } from "~/review/presentation/targetReview/getRowStateTag.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import { WIDGET_APP_LABELS } from "~/review/presentation/widgetAppLabels.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
import { ReviewWidgetPresenter as Abstraction } from "./abstractions.js";
import type { ReviewWidgetInitParams } from "./abstractions.js";
import type { ReviewWidgetKind } from "./abstractions.js";
import type { ReviewWidgetRowVm } from "./abstractions.js";
import type { ReviewWidgetStatus } from "./abstractions.js";
import type { ReviewWidgetTab } from "./abstractions.js";

class ReviewWidgetPresenterImpl implements Abstraction.Interface {
    private _kind: ReviewWidgetKind = "forMe";
    private _tab: ReviewWidgetTab = "assignedToMe";
    private _status: ReviewWidgetStatus = "loading";
    private _rows: ReviewListRow[] = [];
    // The app the widget was opened for; the list use case routes by it (R348).
    private app: WorkflowAppKind | null = null;
    private rowProvider: IReviewRowProvider | null = null;
    private unsubscribe: (() => void) | null = null;
    // A generation: every load, tab switch and dispose starts a new one, and a response of an
    // older generation is ignored. An in-flight refresh only counts for the generation it started in.
    private loadToken = 0;
    private refreshingToken: number | null = null;
    private refreshQueued = false;
    // A live signal that arrived while a load was in flight; consumed once the page applies.
    private signalDuringLoad = false;

    constructor(
        private listReviewsUseCase: ListReviewsUseCase.Interface,
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            ReviewWidgetPresenterImpl,
            | "listReviewsUseCase"
            | "activity"
            | "identityContext"
            | "app"
            | "rowProvider"
            | "unsubscribe"
            | "loadToken"
            | "refreshingToken"
            | "refreshQueued"
            | "signalDuringLoad"
        >(this, {
            listReviewsUseCase: false,
            activity: false,
            identityContext: false,
            app: false,
            rowProvider: false,
            unsubscribe: false,
            loadToken: false,
            refreshingToken: false,
            refreshQueued: false,
            signalDuringLoad: false
        });
    }

    get vm(): Abstraction.ViewModel {
        const now = new Date();
        const rows = this._rows
            .slice(0, REVIEW_WIDGET_PAGE_SIZE)
            .map(row => this.toRowVm(row, now));

        let tab: ReviewWidgetTab | null = null;
        if (this._kind === "forMe") {
            tab = this._tab;
        }

        return {
            tab,
            rows,
            status: this._status,
            empty: this._status === "ready" && rows.length === 0,
            hasTeams: this.identityContext.getIdentity().teams.length > 0
        };
    }

    async init(params: ReviewWidgetInitParams): Promise<void> {
        this.dispose();
        this.app = params.app;
        this.rowProvider = params.rowProvider;
        this._kind = params.kind;
        this._tab = "assignedToMe";
        this.unsubscribe = this.activity.subscribe(params.namespaces, () => {
            void this.refresh();
        });

        const token = this.beginLoad();
        try {
            const listed = await this.listReviewsUseCase.execute({
                app: params.app,
                list: this.getList(),
                where: {},
                sort: this.getSort(),
                limit: REVIEW_WIDGET_PAGE_SIZE,
                after: null
            });
            if (token === this.loadToken) {
                this.applyPage(listed);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyFailure();
            }
        }
    }

    async setTab(tab: ReviewWidgetTab): Promise<void> {
        const app = this.app;
        if (!app || this._kind !== "forMe" || tab === this._tab) {
            return;
        }

        this._tab = tab;

        const token = this.beginLoad();
        try {
            const listed = await this.listReviewsUseCase.execute({
                app,
                list: this.getList(),
                where: {},
                sort: this.getSort(),
                limit: REVIEW_WIDGET_PAGE_SIZE,
                after: null
            });
            if (token === this.loadToken) {
                this.applyPage(listed);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyFailure();
            }
        }
    }

    async refresh(): Promise<void> {
        const app = this.app;
        if (!app) {
            return;
        }

        // "Try again" on a failed widget: a reload with the skeleton.
        if (this._status === "failed") {
            const reloadToken = this.beginLoad();
            try {
                const listed = await this.listReviewsUseCase.execute({
                    app,
                    list: this.getList(),
                    where: {},
                    sort: this.getSort(),
                    limit: REVIEW_WIDGET_PAGE_SIZE,
                    after: null
                });
                if (reloadToken === this.loadToken) {
                    this.applyPage(listed);
                }
            } catch {
                if (reloadToken === this.loadToken) {
                    this.applyFailure();
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

        try {
            const listed = await this.listReviewsUseCase.execute({
                app,
                list: this.getList(),
                where: {},
                sort: this.getSort(),
                limit: REVIEW_WIDGET_PAGE_SIZE,
                after: null
            });
            if (token === this.loadToken) {
                this.applyPage(listed);
            }
        } catch {
            // A failed background refresh keeps the rows on screen; the next signal tries again.
        }

        // A newer generation (tab switch, reload, dispose) owns the flags now.
        if (token !== this.loadToken) {
            return;
        }
        this.refreshingToken = null;
        if (this.refreshQueued) {
            this.refreshQueued = false;
            await this.refresh();
        }
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
        this._kind = "forMe";
        this._tab = "assignedToMe";
        this._status = "loading";
        this._rows = [];
    }

    // Starts a new generation and shows the skeleton.
    private beginLoad(): number {
        this.loadToken += 1;
        this.refreshQueued = false;
        this.signalDuringLoad = false;
        this._status = "loading";
        this._rows = [];
        return this.loadToken;
    }

    private applyPage(listed: ReviewListPage): void {
        this._rows = listed.items.map(item => toReviewListRow(item));
        this._status = "ready";

        // A signal that arrived during the load is answered by one refresh now that the rows exist.
        if (this.signalDuringLoad) {
            this.signalDuringLoad = false;
            void this.refresh();
        }
    }

    private applyFailure(): void {
        this.signalDuringLoad = false;
        this._rows = [];
        this._status = "failed";
    }

    private getList(): "assignedToMe" | "pool" | "myRequests" {
        if (this._kind === "myRequests") {
            return "myRequests";
        }
        return this._tab;
    }

    private getSort(): ReviewListSort {
        if (this._kind === "myRequests") {
            return "lastChangedOn_DESC";
        }
        return "lastChangedOn_ASC";
    }

    private toRowVm(row: ReviewListRow, now: Date): ReviewWidgetRowVm {
        const resolved = resolveRowBinding(this.rowProvider, row);

        const stateTag = getRowStateTag(row);
        let stateLabel = getListReviewStateLabel(row.reviewState);
        if (stateTag.label) {
            stateLabel = stateTag.label;
        }

        return {
            reviewId: row.reviewId,
            title: row.title,
            stepTitle: row.stepTitle,
            stepColor: row.stepColor,
            contentType: resolved.contentTypeLabel || null,
            app: this.app ? WIDGET_APP_LABELS[this.app] : "",
            stateIcon: stateTag.icon,
            stateLabel,
            stateVariant: stateTag.variant,
            lastChange: formatLastChange(row.lastChangedOn, now),
            contentUrl: resolved.contentUrl
        };
    }
}

export const ReviewWidgetPresenter = Abstraction.createImplementation({
    implementation: ReviewWidgetPresenterImpl,
    dependencies: [ListReviewsUseCase, ReviewActivity, IdentityContext]
});
