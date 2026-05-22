import { makeAutoObservable, computed } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import {
    WebhookDeliveriesPresenter as Abstraction,
    type IWebhookDeliveriesPresenter,
    type IWebhookDeliveriesViewModel
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

    public async loadMore(): Promise<void> {
        await this.listPresenter.actions.loadMore();
    }

    public async resend(id: string): Promise<void> {
        await this.resendDeliveryUseCase.execute(id);
        await this.listPresenter.actions.refresh();
    }

    public selectDelivery(delivery: WebhookDelivery | null): void {
        this._selectedDelivery = delivery;
    }

    init(webhookId: string): void {
        const dataSource = new WebhookDeliveriesDataSource(this.listDeliveriesUseCase, {
            webhookId_eq: webhookId
        });
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
