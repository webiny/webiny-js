import { makeAutoObservable, computed, runInAction } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { WebhookDelivery, WebhookEvent } from "~/admin/shared/types.js";
import { ListWebhookDeliveriesUseCase } from "~/admin/features/listWebhookDeliveries/abstractions.js";
import { ResendWebhookDeliveryUseCase } from "~/admin/features/resendWebhookDelivery/abstractions.js";
import { ListAvailableEventsUseCase } from "~/admin/features/listAvailableEvents/abstractions.js";
import { ListWebhooksUseCase } from "~/admin/features/ListWebhooks/abstractions.js";
import { WebhookDeliveriesDataSource } from "./WebhookDeliveriesDataSource.js";
import {
    WebhookDeliveriesPagePresenter as Abstraction,
    type IWebhookDeliveriesPagePresenter,
    type IWebhookDeliveriesPageViewModel,
    type IDeliveryFilterOption,
    type IDeliveryPageFilters
} from "./abstractions.js";

const createEmptyFilters = (): IDeliveryPageFilters => {
    return {
        webhookId: null,
        app: null,
        entity: null,
        eventName: null,
        status: []
    };
};

class WebhookDeliveriesPagePresenterImpl implements IWebhookDeliveriesPagePresenter {
    private _availableEvents: WebhookEvent[] = [];
    private _availableWebhooks: IDeliveryFilterOption[] = [];
    private _filters: IDeliveryPageFilters = createEmptyFilters();
    private _resendingIds: Set<string> = new Set();
    private _loading = false;
    private _error: string | null = null;

    constructor(
        private readonly listPresenter: ListPresenter.Interface<WebhookDelivery>,
        private readonly listDeliveriesUseCase: ListWebhookDeliveriesUseCase.Interface,
        private readonly listAvailableEventsUseCase: ListAvailableEventsUseCase.Interface,
        private readonly resendDeliveryUseCase: ResendWebhookDeliveryUseCase.Interface,
        private readonly listWebhooksUseCase: ListWebhooksUseCase.Interface
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): IWebhookDeliveriesPageViewModel {
        return {
            availableWebhooks: this._availableWebhooks,
            availableApps: this._computeAvailableApps(),
            availableEntities: this._computeAvailableEntities(),
            availableEventNames: this._computeAvailableEventNames(),
            filters: { ...this._filters },
            hasFilters: this._hasFilters(),
            list: this.listPresenter.vm,
            resendingIds: new Set(this._resendingIds),
            loading: this._loading || this.listPresenter.vm.pagination.loading,
            error: this._error
        };
    }

    public async init(webhookId?: string): Promise<void> {
        runInAction(() => {
            this._loading = true;
            this._error = null;
            if (webhookId) {
                this._filters = { ...this._filters, webhookId };
            }
        });
        try {
            const [events, webhooksResult] = await Promise.all([
                this.listAvailableEventsUseCase.execute(),
                this.listWebhooksUseCase.execute({ limit: 1000 })
            ]);
            runInAction(() => {
                this._availableEvents = events;
                this._availableWebhooks = webhooksResult.items.map(w => ({
                    value: w.id,
                    label: w.name
                }));
            });
        } catch (err) {
            runInAction(() => {
                this._error = err instanceof Error ? err.message : "Failed to load data.";
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }

        const dataSource = new WebhookDeliveriesDataSource(this.listDeliveriesUseCase);
        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            initialFilters: this._buildWhere(),
            limit: 20
        });
    }

    public clearFilters(): void {
        this._filters = createEmptyFilters();
        this.listPresenter.actions.filter.clearAll();
    }

    public setWebhookFilter(webhookId: string | null): void {
        this._filters = { ...this._filters, webhookId };
        this._syncFilters();
    }

    public setAppFilter(app: string | null): void {
        this._filters = { ...this._filters, app, entity: null, eventName: null };
        this._syncFilters();
    }

    public setEntityFilter(entity: string | null): void {
        this._filters = { ...this._filters, entity, eventName: null };
        this._syncFilters();
    }

    public setEventFilter(eventName: string | null): void {
        this._filters = { ...this._filters, eventName };
        this._syncFilters();
    }

    public setStatusFilter(status: string[]): void {
        this._filters = { ...this._filters, status };
        this._syncFilters();
    }

    public async loadMore(): Promise<void> {
        await this.listPresenter.actions.loadMore();
    }

    public async resend(id: string): Promise<void> {
        runInAction(() => {
            this._resendingIds.add(id);
        });
        try {
            await this.resendDeliveryUseCase.execute(id);
            await this.listPresenter.actions.refresh();
        } finally {
            runInAction(() => {
                this._resendingIds.delete(id);
            });
        }
    }

    private _hasFilters(): boolean {
        return (
            this._filters.webhookId !== null ||
            this._filters.app !== null ||
            this._filters.entity !== null ||
            this._filters.eventName !== null ||
            this._filters.status.length > 0
        );
    }

    private _syncFilters(): void {
        const where = this._buildWhere();
        this.listPresenter.actions.filter.clearAll();
        for (const [key, value] of Object.entries(where)) {
            this.listPresenter.actions.filter.set(key, value);
        }
    }

    private _buildWhere(): Record<string, unknown> {
        const where: Record<string, unknown> = {};

        if (this._filters.webhookId) {
            where.webhookId_eq = this._filters.webhookId;
        }

        const { app, entity, eventName } = this._filters;

        if (app || entity || eventName) {
            const matching = this._availableEvents.filter(event => {
                if (app && event.app !== app) {
                    return false;
                }
                if (entity && event.entity !== entity) {
                    return false;
                }
                if (eventName && event.eventName !== eventName) {
                    return false;
                }
                return true;
            });
            if (matching.length > 0) {
                where.eventType_in = matching.map(e => e.eventName);
            }
        }

        if (this._filters.status.length > 0) {
            where.status_in = this._filters.status;
        }

        return where;
    }

    private _computeAvailableApps(): IDeliveryFilterOption[] {
        const seen = new Set<string>();
        const result: IDeliveryFilterOption[] = [];
        for (const event of this._availableEvents) {
            if (!seen.has(event.app)) {
                seen.add(event.app);
                result.push({ value: event.app, label: event.appLabel });
            }
        }
        return result;
    }

    private _computeAvailableEntities(): IDeliveryFilterOption[] {
        if (!this._filters.app) {
            return [];
        }
        const seen = new Set<string>();
        const result: IDeliveryFilterOption[] = [];
        for (const event of this._availableEvents) {
            if (event.app === this._filters.app && !seen.has(event.entity)) {
                seen.add(event.entity);
                result.push({ value: event.entity, label: event.entityLabel });
            }
        }
        return result;
    }

    private _computeAvailableEventNames(): IDeliveryFilterOption[] {
        if (!this._filters.app) {
            return [];
        }
        return this._availableEvents
            .filter(event => {
                if (event.app !== this._filters.app) {
                    return false;
                }
                if (this._filters.entity && event.entity !== this._filters.entity) {
                    return false;
                }
                return true;
            })
            .map(event => ({ value: event.eventName, label: event.label }));
    }
}

export const WebhookDeliveriesPagePresenter = Abstraction.createImplementation({
    implementation: WebhookDeliveriesPagePresenterImpl,
    dependencies: [
        ListPresenter,
        ListWebhookDeliveriesUseCase,
        ListAvailableEventsUseCase,
        ResendWebhookDeliveryUseCase,
        ListWebhooksUseCase
    ]
});
