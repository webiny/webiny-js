import { makeAutoObservable, runInAction, computed } from "mobx";
import type { Webhook } from "~/admin/shared/types.js";
import type { WebhookEvent } from "~/admin/shared/types.js";
import {
    WebhookFormPresenter as Abstraction,
    type IWebhookFormPresenter,
    type IWebhookFormViewModel,
    type IWebhookFormActions
} from "./abstractions.js";
import { GetWebhookUseCase } from "~/admin/features/getWebhook/abstractions.js";
import { CreateWebhookUseCase } from "~/admin/features/createWebhook/abstractions.js";
import { UpdateWebhookUseCase } from "~/admin/features/updateWebhook/abstractions.js";
import { DeleteWebhookUseCase } from "~/admin/features/deleteWebhook/abstractions.js";
import { ListAvailableEventsUseCase } from "~/admin/features/listAvailableEvents/abstractions.js";
import { WebhookPermissions } from "~/admin/features/permissions/abstractions.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";

class WebhookFormPresenterImpl implements IWebhookFormPresenter {
    private _loading = false;
    private _saving = false;
    private _isNew = false;
    private _webhook: Webhook | null = null;
    private _showDeliveries = false;
    private _availableEvents: WebhookEvent[] = [];
    private _webhookId: string | null = null;

    constructor(
        private readonly formModelFactory: FormModelFactory.Interface,
        private readonly getWebhookUseCase: GetWebhookUseCase.Interface,
        private readonly createWebhookUseCase: CreateWebhookUseCase.Interface,
        private readonly updateWebhookUseCase: UpdateWebhookUseCase.Interface,
        private readonly deleteWebhookUseCase: DeleteWebhookUseCase.Interface,
        private readonly listAvailableEventsUseCase: ListAvailableEventsUseCase.Interface,
        private readonly permissions: WebhookPermissions.Interface
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): IWebhookFormViewModel {
        return {
            loading: this._loading,
            saving: this._saving,
            isNew: this._isNew,
            webhook: this._webhook,
            showDeliveries: this._showDeliveries,
            availableEvents: this._availableEvents,
            permissions: {
                canEdit: this.permissions.canEdit("webhook"),
                canDelete: this.permissions.canDelete("webhook")
            }
        };
    }

    actions: IWebhookFormActions = {
        save: async () => {
            this._saving = true;
            /* FormModel submit + create/update will be wired here. */
            runInAction(() => {
                this._saving = false;
            });
        },
        deleteWebhook: async () => {
            if (!this._webhookId || this._isNew) {
                return;
            }
            await this.deleteWebhookUseCase.execute(this._webhookId);
        },
        openDeliveries: () => {
            this._showDeliveries = true;
        },
        closeDeliveries: () => {
            this._showDeliveries = false;
        }
    };

    async init(id: string): Promise<void> {
        this._loading = true;
        this._isNew = id === "new";
        this._webhookId = id === "new" ? null : id;

        const eventsPromise = this.listAvailableEventsUseCase.execute();

        if (!this._isNew) {
            const [webhook, events] = await Promise.all([
                this.getWebhookUseCase.execute(id),
                eventsPromise
            ]);

            runInAction(() => {
                this._webhook = webhook;
                this._availableEvents = events;
                this._loading = false;
            });
        } else {
            const events = await eventsPromise;

            runInAction(() => {
                this._availableEvents = events;
                this._loading = false;
            });
        }
    }
}

export const WebhookFormPresenter = Abstraction.createImplementation({
    implementation: WebhookFormPresenterImpl,
    dependencies: [
        FormModelFactory,
        GetWebhookUseCase,
        CreateWebhookUseCase,
        UpdateWebhookUseCase,
        DeleteWebhookUseCase,
        ListAvailableEventsUseCase,
        WebhookPermissions
    ]
});
