import { computed, makeAutoObservable, runInAction } from "mobx";
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
import {
    FormModelFactory,
    type IFormModel
} from "@webiny/app-admin/features/formModel/abstractions.js";

class WebhookFormPresenterImpl implements IWebhookFormPresenter {
    private _loading = false;
    private _saving = false;
    private _isNew = false;
    private _webhook: Webhook | null = null;
    private _showDeliveries = false;
    private _webhookId: string | null = null;
    private _form: IFormModel;
    private _eventFieldNames: string[] = [];
    private _eventGroups: Map<string, WebhookEvent[]> = new Map();

    public get vm(): IWebhookFormViewModel {
        return {
            loading: this._loading,
            saving: this._saving,
            isNew: this._isNew,
            webhook: this._webhook,
            showDeliveries: this._showDeliveries,
            permissions: {
                canEdit: this.permissions.canEdit("webhook"),
                canDelete: this.permissions.canDelete("webhook")
            },
            form: this._form.vm
        };
    }

    public constructor(
        private readonly formModelFactory: FormModelFactory.Interface,
        private readonly getWebhookUseCase: GetWebhookUseCase.Interface,
        private readonly createWebhookUseCase: CreateWebhookUseCase.Interface,
        private readonly updateWebhookUseCase: UpdateWebhookUseCase.Interface,
        private readonly deleteWebhookUseCase: DeleteWebhookUseCase.Interface,
        private readonly listAvailableEventsUseCase: ListAvailableEventsUseCase.Interface,
        private readonly permissions: WebhookPermissions.Interface
    ) {
        this._form = this.buildForm();

        makeAutoObservable(this, { vm: computed });
    }

    private buildForm(): IFormModel {
        return this.formModelFactory.create({
            fields: fields => ({
                name: fields.text().label("Name").required("Name is required"),
                slug: fields.text().label("Slug").required("Slug is required"),
                endpointUrl: fields
                    .text()
                    .label("Endpoint URL")
                    .required("Endpoint URL is required")
                    .placeholder("https://"),
                description: fields.text().label("Description").renderer("textarea"),
                enabled: fields.boolean().label("Enabled").defaultValue(false)
            }),
            layout: layout => [
                layout.row("name", "slug"),
                layout.row("endpointUrl"),
                layout.row("description"),
                layout.row("enabled")
            ]
        });
    }

    private eventFieldName(app: string): string {
        const slug = app
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, "");
        return `events_${slug}`;
    }

    private addEventFields(events: WebhookEvent[]): void {
        const grouped = new Map<string, WebhookEvent[]>();
        for (const event of events) {
            const existing = grouped.get(event.app) ?? [];
            existing.push(event);
            grouped.set(event.app, existing);
        }

        this._eventGroups = grouped;
        this._eventFieldNames = [];

        this._form.fields(fields => {
            const result: Record<string, ReturnType<typeof fields.object>> = {};

            for (const [app, appEvents] of grouped) {
                const fieldName = this.eventFieldName(app);
                this._eventFieldNames.push(fieldName);

                result[fieldName] = fields
                    .object()
                    .label(app)
                    .renderer("objectAccordionSingle")
                    .fields(f => {
                        return {
                            selected: f
                                .text()
                                .list()
                                .options(
                                    appEvents.map(e => ({
                                        label: e.label,
                                        value: e.eventName
                                    }))
                                )
                                .renderer("checkboxes")
                        };
                    });
            }

            return result;
        });

        this._form.setLayout(layout => [
            layout.row("name", "slug"),
            layout.row("endpointUrl"),
            layout.row("description"),
            layout.row("enabled"),
            layout.separator(),
            ...this._eventFieldNames.map(name =>
                layout.object(name, inner => [inner.row("selected")])
            )
        ]);

        this._form.addRule(form => {
            if (this._eventFieldNames.length === 0) {
                return [];
            }
            for (const fieldName of this._eventFieldNames) {
                const objectField = form.field(fieldName).as("object");
                const selectedField = objectField.children.get("selected");
                if (!selectedField) {
                    continue;
                }
                const values = selectedField.getValue<string[]>();
                if (values && values.length > 0) {
                    return [];
                }
            }

            return [{ path: "Events", message: "At least one event must be selected." }];
        });
    }

    private collectEvents(): string[] {
        const allEvents: string[] = [];

        for (const fieldName of this._eventFieldNames) {
            const objectField = this._form.field(fieldName).as("object");
            const selectedField = objectField.children.get("selected");
            if (!selectedField) {
                continue;
            }
            const values = selectedField.getValue<string[]>();
            if (values && values.length > 0) {
                allEvents.push(...values);
            }
        }

        return allEvents;
    }

    private distributeEvents(webhookEvents: string[]): void {
        const eventSet = new Set(webhookEvents);

        for (const [app, appEvents] of this._eventGroups) {
            const fieldName = this.eventFieldName(app);
            const objectField = this._form.field(fieldName).as("object");
            const selectedField = objectField.children.get("selected");
            if (!selectedField) {
                continue;
            }

            const selected = appEvents.filter(e => eventSet.has(e.eventName)).map(e => e.eventName);
            selectedField.setValue(selected);
        }
    }

    public actions: IWebhookFormActions = {
        save: async () => {
            const data = await this._form.submit<Record<string, unknown>>();
            if (data === false) {
                return;
            }

            this._saving = true;

            try {
                const merged = {
                    name: data.name as string,
                    slug: data.slug as string,
                    endpointUrl: data.endpointUrl as string,
                    description: (data.description as string) || undefined,
                    enabled: data.enabled as boolean,
                    events: this.collectEvents()
                };

                if (this._isNew) {
                    const created = await this.createWebhookUseCase.execute(merged);

                    runInAction(() => {
                        this._webhook = created;
                        this._webhookId = created.id;
                        this._isNew = false;
                        this._form.field("slug").setDisabled(true);
                    });
                } else {
                    const updated = await this.updateWebhookUseCase.execute(
                        this._webhookId!,
                        merged
                    );

                    runInAction(() => {
                        this._webhook = updated;
                    });
                }
            } finally {
                runInAction(() => {
                    this._saving = false;
                });
            }
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

    public async init(id: string): Promise<void> {
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
                this._form = this.buildForm();
                this.addEventFields(events);
                this._form.setData({
                    name: webhook.name,
                    slug: webhook.slug,
                    endpointUrl: webhook.endpointUrl,
                    description: webhook.description ?? "",
                    enabled: webhook.enabled
                });
                this._form.field("slug").setDisabled(true);
                this.distributeEvents(webhook.events);
                this._loading = false;
            });
        } else {
            const events = await eventsPromise;

            runInAction(() => {
                this._form = this.buildForm();
                this.addEventFields(events);
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
