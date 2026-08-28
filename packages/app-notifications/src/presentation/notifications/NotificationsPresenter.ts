import { makeAutoObservable, runInAction, toJS } from "mobx";
import { NotificationsPresenter as PresenterAbstraction } from "./abstractions.js";
import type { NotificationsTab } from "./abstractions.js";
import { NotificationsApi } from "~/features/api/abstractions.js";
import type { Notification, NotificationCounts } from "~/types.js";

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

    constructor(private api: NotificationsApi.Interface) {
        makeAutoObservable<NotificationsPresenterImpl, "api">(this, { api: false });
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
        await this.refreshCounts();
    }

    openPanel() {
        this.open = true;
        void this.reload();
    }

    closePanel() {
        this.open = false;
    }

    togglePanel() {
        this.open ? this.closePanel() : this.openPanel();
    }

    setTab(tab: NotificationsTab) {
        this.tab = tab;
        void this.reload();
    }

    setUnreadOnly(value: boolean) {
        this.unreadOnly = value;
        void this.reload();
    }

    async reload() {
        runInAction(() => {
            this.loading = true;
            this.error = null;
        });
        try {
            const result = await this.api.list({
                archived: this.tab === "archive",
                read: this.unreadOnly ? false : undefined,
                limit: 50
            });
            runInAction(() => {
                this.items = result.items;
                this.loading = false;
            });
        } catch (err) {
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
        await Promise.all([this.reload(), this.refreshCounts()]);
    }

    async markAllRead() {
        await this.api.markAllRead();
        await Promise.all([this.reload(), this.refreshCounts()]);
    }

    async archive(id: string) {
        const notification = this.items.find(item => item.id === id);
        if (notification?.archived) {
            await this.api.unarchive(id);
        } else {
            await this.api.archive(id);
        }
        await Promise.all([this.reload(), this.refreshCounts()]);
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
