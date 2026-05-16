import { makeAutoObservable, computed } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { Webhook } from "~/admin/shared/types.js";
import {
    WebhookListPresenter as Abstraction,
    type IWebhookListPresenter,
    type IWebhookListViewModel,
    type IWebhookListActions
} from "./abstractions.js";
import { WebhookListDataSource } from "./WebhookListDataSource.js";
import { ListWebhooksUseCase } from "~/admin/features/ListWebhooks/abstractions.js";
import { DeleteWebhookUseCase } from "~/admin/features/deleteWebhook/abstractions.js";
import { TriggerWebhookUseCase } from "~/admin/features/triggerWebhook/abstractions.js";
import { WebhookPermissions } from "~/admin/features/permissions/abstractions.js";

class WebhookListPresenterImpl implements IWebhookListPresenter {
    constructor(
        private readonly listPresenter: ListPresenter.Interface<Webhook>,
        private readonly listWebhooksUseCase: ListWebhooksUseCase.Interface,
        private readonly deleteWebhookUseCase: DeleteWebhookUseCase.Interface,
        private readonly triggerWebhookUseCase: TriggerWebhookUseCase.Interface,
        private readonly permissions: WebhookPermissions.Interface
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): IWebhookListViewModel {
        return {
            list: this.listPresenter.vm,
            permissions: {
                canRead: this.permissions.canRead("webhook"),
                canCreate: this.permissions.canCreate("webhook"),
                canEdit: this.permissions.canEdit("webhook"),
                canDelete: this.permissions.canDelete("webhook")
            }
        };
    }

    actions: IWebhookListActions = {
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
        deleteWebhook: async (id: string) => {
            await this.deleteWebhookUseCase.execute(id);
            await this.listPresenter.actions.refresh();
        },
        triggerWebhook: async (id: string) => {
            await this.triggerWebhookUseCase.execute(id, { test: true });
            await this.listPresenter.actions.refresh();
        }
    };

    init(): void {
        const dataSource = new WebhookListDataSource(this.listWebhooksUseCase);
        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 20
        });
    }
}

export const WebhookListPresenter = Abstraction.createImplementation({
    implementation: WebhookListPresenterImpl,
    dependencies: [
        ListPresenter,
        ListWebhooksUseCase,
        DeleteWebhookUseCase,
        TriggerWebhookUseCase,
        WebhookPermissions
    ]
});
