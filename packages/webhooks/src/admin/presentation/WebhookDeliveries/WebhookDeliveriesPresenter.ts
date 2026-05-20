import { makeAutoObservable, computed } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import {
    WebhookDeliveriesPresenter as Abstraction,
    type IWebhookDeliveriesPresenter,
    type IWebhookDeliveriesViewModel,
    type IWebhookDeliveriesActions
} from "./abstractions.js";
import { WebhookDeliveriesDataSource } from "./WebhookDeliveriesDataSource.js";
import { ListWebhookDeliveriesUseCase } from "~/admin/features/listWebhookDeliveries/abstractions.js";
import { ResendWebhookDeliveryUseCase } from "~/admin/features/resendWebhookDelivery/abstractions.js";

class WebhookDeliveriesPresenterImpl implements IWebhookDeliveriesPresenter {
    private _selectedDelivery: WebhookDelivery | null = null;

    constructor(
        private readonly listPresenter: ListPresenter.Interface<WebhookDelivery>,
        private readonly listDeliveriesUseCase: ListWebhookDeliveriesUseCase.Interface,
        private readonly resendDeliveryUseCase: ResendWebhookDeliveryUseCase.Interface
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): IWebhookDeliveriesViewModel {
        return {
            list: this.listPresenter.vm,
            selectedDelivery: this._selectedDelivery
        };
    }

    actions: IWebhookDeliveriesActions = {
        search: {
            set: (query: string) => this.listPresenter.actions.search.set(query),
            clear: () => this.listPresenter.actions.search.clear()
        },
        sort: {
            set: (field: string, direction: "ASC" | "DESC") =>
                this.listPresenter.actions.sort.set(field, direction),
            toggle: (field: string) => this.listPresenter.actions.sort.toggle(field)
        },
        filter: {
            set: (key: string, value: unknown) => this.listPresenter.actions.filter.set(key, value),
            clear: (key: string) => this.listPresenter.actions.filter.clear(key),
            clearAll: () => this.listPresenter.actions.filter.clearAll()
        },
        selection: {
            toggle: (id: string) => this.listPresenter.actions.selection.toggle(id),
            selectRangeTo: (id: string) => this.listPresenter.actions.selection.selectRangeTo(id),
            selectAll: () => this.listPresenter.actions.selection.selectAll(),
            deselectAll: () => this.listPresenter.actions.selection.deselectAll(),
            selectRows: (ids: string[]) => this.listPresenter.actions.selection.selectRows(ids),
            isSelected: (id: string) => this.listPresenter.actions.selection.isSelected(id)
        },
        loadMore: () => this.listPresenter.actions.loadMore(),
        refresh: () => this.listPresenter.actions.refresh(),
        resend: async (id: string) => {
            await this.resendDeliveryUseCase.execute(id);
            await this.listPresenter.actions.refresh();
        },
        selectDelivery: (delivery: WebhookDelivery | null) => {
            this._selectedDelivery = delivery;
        }
    };

    init(webhookId: string): void {
        const dataSource = new WebhookDeliveriesDataSource(this.listDeliveriesUseCase, webhookId);
        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 20
        });
    }
}

export const WebhookDeliveriesPresenter = Abstraction.createImplementation({
    implementation: WebhookDeliveriesPresenterImpl,
    dependencies: [ListPresenter, ListWebhookDeliveriesUseCase, ResendWebhookDeliveryUseCase]
});
