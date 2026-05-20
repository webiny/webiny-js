import { makeAutoObservable, computed, runInAction } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { WebhookDelivery, WebhookEvent } from "~/admin/shared/types.js";
import {
    ListWebhookDeliveriesUseCase,
    type ListWebhookDeliveriesWhere
} from "~/admin/features/listWebhookDeliveries/abstractions.js";
import { ResendWebhookDeliveryUseCase } from "~/admin/features/resendWebhookDelivery/abstractions.js";
import { ListAvailableEventsUseCase } from "~/admin/features/listAvailableEvents/abstractions.js";
import { WebhookDeliveriesDataSource } from "~/admin/presentation/WebhookDeliveries/WebhookDeliveriesDataSource.js";
import {
    WebhookDeliveriesPagePresenter as Abstraction,
    type IWebhookDeliveriesPagePresenter,
    type IWebhookDeliveriesPageViewModel,
    type IWebhookDeliveriesPageActions,
    type IDeliveryFilterOption,
    type IDeliveryPageFilters
} from "./abstractions.js";

class WebhookDeliveriesPagePresenterImpl implements IWebhookDeliveriesPagePresenter {
    private _availableEvents: WebhookEvent[] = [];
    private _filters: IDeliveryPageFilters = {
        app: null,
        entity: null,
        eventName: null,
        status: []
    };
    private _expandedDeliveryId: string | null = null;
    private _loading = false;
    private _error: string | null = null;

    constructor(
        private readonly listPresenter: ListPresenter.Interface<WebhookDelivery>,
        private readonly listDeliveriesUseCase: ListWebhookDeliveriesUseCase.Interface,
        private readonly listAvailableEventsUseCase: ListAvailableEventsUseCase.Interface,
        private readonly resendDeliveryUseCase: ResendWebhookDeliveryUseCase.Interface
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): IWebhookDeliveriesPageViewModel {
        return {
            availableApps: this._computeAvailableApps(),
            availableEntities: this._computeAvailableEntities(),
            availableEventNames: this._computeAvailableEventNames(),
            filters: { ...this._filters },
            list: this.listPresenter.vm,
            expandedDeliveryId: this._expandedDeliveryId,
            loading: this._loading,
            error: this._error
        };
    }

    public readonly actions: IWebhookDeliveriesPageActions = {
        init: async () => {
            runInAction(() => {
                this._loading = true;
                this._error = null;
            });
            try {
                const events = await this.listAvailableEventsUseCase.execute();
                runInAction(() => {
                    this._availableEvents = events;
                });
            } catch (err) {
                runInAction(() => {
                    this._error = err instanceof Error ? err.message : "Failed to load events.";
                });
            } finally {
                runInAction(() => {
                    this._loading = false;
                });
            }
            runInAction(() => {
                this._applyFilters();
            });
        },
        setAppFilter: (app: string | null) => {
            this._filters = { app, entity: null, eventName: null, status: this._filters.status };
            this._expandedDeliveryId = null;
            this._applyFilters();
        },
        setEntityFilter: (entity: string | null) => {
            this._filters = { ...this._filters, entity, eventName: null };
            this._expandedDeliveryId = null;
            this._applyFilters();
        },
        setEventFilter: (eventName: string | null) => {
            this._filters = { ...this._filters, eventName };
            this._expandedDeliveryId = null;
            this._applyFilters();
        },
        setStatusFilter: (status: string[]) => {
            this._filters = { ...this._filters, status };
            this._expandedDeliveryId = null;
            this._applyFilters();
        },
        expandDelivery: (id: string | null) => {
            this._expandedDeliveryId = this._expandedDeliveryId === id ? null : id;
        },
        loadMore: async () => {
            await this.listPresenter.actions.loadMore();
        },
        resend: async (id: string) => {
            await this.resendDeliveryUseCase.execute(id);
            await this.listPresenter.actions.refresh();
        }
    };

    private _applyFilters(): void {
        const where = this._buildWhere();
        const dataSource = new WebhookDeliveriesDataSource(this.listDeliveriesUseCase, where);
        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 20
        });
    }

    private _buildWhere(): ListWebhookDeliveriesWhere {
        const where: ListWebhookDeliveriesWhere = {};
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
        ResendWebhookDeliveryUseCase
    ]
});
