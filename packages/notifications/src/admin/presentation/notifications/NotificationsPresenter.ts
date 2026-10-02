import { makeAutoObservable, runInAction, toJS } from "mobx";
import { NotificationsPresenter as PresenterAbstraction } from "./abstractions.js";
import type { NotificationsTab } from "./abstractions.js";
import { NotificationsApi } from "~/admin/features/api/abstractions.js";
import type { Notification, NotificationCounts } from "~/admin/types.js";

const EMPTY_COUNTS: NotificationCounts = { inbox: 0, archive: 0, unread: 0 };

class NotificationsPresenterImpl implements PresenterAbstraction.Interface {
    private open = false;
    private loading = false;
    private error: string | null = null;
    private tab: NotificationsTab = "inbox";
    private unreadOnly = false;
    private counts: NotificationCounts = EMPTY_COUNTS;
    private items: Notification[] = [];
    private loaded = false;
    private latestRequestId = 0;
    /** Last list loaded per tab and filter, so switching back doesn't start from empty. */
    private cache = new Map<string, Notification[]>();

    constructor(private api: NotificationsApi.Interface) {
        makeAutoObservable<NotificationsPresenterImpl, "api" | "latestRequestId" | "cache">(this, {
            api: false,
            latestRequestId: false,
            cache: false
        });
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            open: this.open,
            loading: this.loading,
            error: this.error,
            tab: this.tab,
            unreadOnly: this.unreadOnly,
            counts: toJS(this.counts),
            items: toJS(this.items)
        };
    }

    async init() {
        if (this.loaded) {
            return;
        }
        this.loaded = true;
        // Nothing pushes new notifications to the browser, so catch up when the user comes back.
        if (typeof window !== "undefined") {
            window.addEventListener("focus", this.onWindowFocus);
        }
        await this.refreshCounts();
    }

    openPanel() {
        this.open = true;
        this.showCurrentView();
        void this.refreshCounts();
    }

    private onWindowFocus = () => {
        void this.refreshCounts();
        if (this.open) {
            void this.loadItems({ showLoading: false });
        }
    };

    closePanel() {
        this.open = false;
    }

    togglePanel() {
        this.open ? this.closePanel() : this.openPanel();
    }

    setTab(tab: NotificationsTab) {
        this.tab = tab;
        this.showCurrentView();
    }

    setUnreadOnly(value: boolean) {
        this.unreadOnly = value;
        this.showCurrentView();
    }

    async reload() {
        await this.loadItems({ showLoading: true });
    }

    private get viewKey() {
        return `${this.tab}:${this.unreadOnly}`;
    }

    /**
     * Shows the last list loaded for the current tab and filter straight away and updates it in
     * the background. The loading state only appears the first time a view is opened.
     */
    private showCurrentView() {
        const cached = this.cache.get(this.viewKey);
        if (cached) {
            this.items = cached;
            void this.loadItems({ showLoading: false });
            return;
        }
        this.items = [];
        void this.loadItems({ showLoading: true });
    }

    /**
     * After mark read or archive, other views may hold stale lists (an archived item still in
     * Inbox), so drop them; they load fresh the next time they're opened.
     */
    private forgetOtherViews() {
        const current = this.cache.get(this.viewKey);
        this.cache.clear();
        if (current) {
            this.cache.set(this.viewKey, current);
        }
    }

    private async loadItems({ showLoading }: { showLoading: boolean }) {
        const key = this.viewKey;
        const archived = this.tab === "archive";
        const unreadOnly = this.unreadOnly;
        // Switching tabs or filters quickly can leave an older request still in flight; it may
        // fill its own view's cache, but only the latest request writes the visible list.
        const requestId = ++this.latestRequestId;
        runInAction(() => {
            // Set either way: an older request that showed the loading state won't clear it,
            // because it's no longer the latest.
            this.loading = showLoading;
            this.error = null;
        });
        try {
            const result = await this.api.list({
                archived,
                read: unreadOnly ? false : undefined,
                limit: 50
            });
            runInAction(() => {
                this.cache.set(key, result.items);
                if (requestId === this.latestRequestId) {
                    this.items = result.items;
                    this.loading = false;
                }
            });
        } catch (err) {
            if (requestId !== this.latestRequestId) {
                return;
            }
            runInAction(() => {
                this.error = (err as Error).message;
                this.loading = false;
            });
        }
    }

    async refresh() {
        await Promise.all([this.reload(), this.refreshCounts()]);
    }

    async markRead(id: string) {
        await this.api.markRead(id);
        this.forgetOtherViews();
        await Promise.all([this.loadItems({ showLoading: false }), this.refreshCounts()]);
    }

    async markAllRead() {
        await this.api.markAllRead();
        this.forgetOtherViews();
        await Promise.all([this.loadItems({ showLoading: false }), this.refreshCounts()]);
    }

    async archive(id: string) {
        const notification = this.items.find(item => item.id === id);
        if (notification?.archived) {
            await this.api.unarchive(id);
        } else {
            await this.api.archive(id);
        }
        this.forgetOtherViews();
        await Promise.all([this.loadItems({ showLoading: false }), this.refreshCounts()]);
    }

    private async refreshCounts() {
        try {
            const counts = await this.api.counts();
            runInAction(() => {
                this.counts = counts;
            });
        } catch {
            // best-effort
        }
    }
}

export const NotificationsPresenter = PresenterAbstraction.createImplementation({
    implementation: NotificationsPresenterImpl,
    dependencies: [NotificationsApi]
});
