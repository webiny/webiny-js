import { computed, makeAutoObservable, runInAction } from "mobx";
import type { Webhook } from "~/admin/shared/types.js";
import type { WebhookEvent } from "~/admin/shared/types.js";
import {
    WebhookFormPresenter as Abstraction,
    type IWebhookFormPresenter,
    type IWebhookFormViewModel
} from "./abstractions.js";
import { GetWebhookUseCase } from "~/admin/features/getWebhook/abstractions.js";
import { CreateWebhookUseCase } from "~/admin/features/createWebhook/abstractions.js";
import { UpdateWebhookUseCase } from "~/admin/features/updateWebhook/abstractions.js";
import { DeleteWebhookUseCase } from "~/admin/features/deleteWebhook/abstractions.js";
import { ListAvailableEventsUseCase } from "~/admin/features/listAvailableEvents/abstractions.js";
import { WebhookPermissions } from "~/admin/features/permissions/abstractions.js";
import {
    FormModelFactory,
    type IFormModel,
    type ILayoutNodeBuilder
} from "@webiny/app-admin/features/formModel/abstractions.js";

class WebhookFormPresenterImpl implements IWebhookFormPresenter {
    private _loading = false;
    private _saving = false;
    private _isNew = false;
    private _webhook: Webhook | null = null;
    private _webhookId: string | null = null;
    private _form: IFormModel;
    private _entityFieldNames: string[] = [];
    private _entityGroups: Map<string, Map<string, WebhookEvent[]>> = new Map();

    public get vm(): IWebhookFormViewModel {
        return {
            loading: this._loading,
            saving: this._saving,
            isNew: this._isNew,
            webhook: this._webhook,
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
                slug: fields
                    .text()
                    .label("Slug")
                    .required("Slug is required")
                    .computedUntilDirty(form => {
                        const name = String(form.field("name").getValue() ?? "");
                        return name
                            .trim()
                            .toLowerCase()
                            .replace(/[^a-z0-9\s-]/g, "")
                            .replace(/\s+/g, "-");
                    }),
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

    private entityFieldName(appLabel: string, entityLabel: string): string {
        const slug = `${appLabel}_${entityLabel}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, "");
        return `events_${slug}`;
    }

    private addEventFields(events: WebhookEvent[]): void {
        const grouped = new Map<string, Map<string, WebhookEvent[]>>();
        for (const event of events) {
            let appMap = grouped.get(event.appLabel);
            if (!appMap) {
                appMap = new Map();
                grouped.set(event.appLabel, appMap);
            }
            const existing = appMap.get(event.entityLabel) ?? [];
            existing.push(event);
            appMap.set(event.entityLabel, existing);
        }

        this._entityGroups = grouped;
        this._entityFieldNames = [];

        this._form.fields(fields => {
            const result: Record<string, ReturnType<typeof fields.object>> = {};

            for (const [appLabel, entities] of grouped) {
                for (const [entityLabel, entityEvents] of entities) {
                    const fieldName = this.entityFieldName(appLabel, entityLabel);
                    this._entityFieldNames.push(fieldName);

                    result[fieldName] = fields
                        .object()
                        .label(entityLabel)
                        .renderer("objectAccordionSingle", { open: false })
                        .fields(f => {
                            return {
                                selected: f
                                    .text()
                                    .list()
                                    .options(
                                        entityEvents.map(e => ({
                                            label: e.label,
                                            value: e.eventName
                                        }))
                                    )
                                    .renderer("checkboxes")
                            };
                        });
                }
            }

            return result;
        });

        this._form.setLayout(layout => {
            const rows: ILayoutNodeBuilder[] = [
                layout.row("name", "slug"),
                layout.row("endpointUrl"),
                layout.row("description"),
                layout.row("enabled")
            ];

            for (const [appLabel, entities] of grouped) {
                rows.push(layout.separator());
                rows.push(layout.element("sectionHeading", { label: appLabel }));

                for (const [entityLabel] of entities) {
                    const fieldName = this.entityFieldName(appLabel, entityLabel);
                    rows.push(layout.object(fieldName, inner => [inner.row("selected")]));
                }
            }

            return rows;
        });

        this._form.addRule(form => {
            if (this._entityFieldNames.length === 0) {
                return [];
            }
            for (const fieldName of this._entityFieldNames) {
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

        for (const fieldName of this._entityFieldNames) {
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

        for (const [appLabel, entities] of this._entityGroups) {
            for (const [entityLabel, entityEvents] of entities) {
                const fieldName = this.entityFieldName(appLabel, entityLabel);
                const objectField = this._form.field(fieldName).as("object");
                const selectedField = objectField.children.get("selected");
                if (!selectedField) {
                    continue;
                }

                const selected = entityEvents
                    .filter(e => eventSet.has(e.eventName))
                    .map(e => e.eventName);
                selectedField.setValue(selected);
            }
        }
    }

    public async save(): Promise<boolean> {
        const data = await this._form.submit<Record<string, unknown>>();
        if (data === false) {
            return false;
        }

        runInAction(() => {
            this._saving = true;
        });

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
                const updated = await this.updateWebhookUseCase.execute(this._webhookId!, merged);

                runInAction(() => {
                    this._webhook = updated;
                });
            }
        } finally {
            runInAction(() => {
                this._saving = false;
            });
        }

        return true;
    }

    public async deleteWebhook(): Promise<void> {
        if (!this._webhookId || this._isNew) {
            return;
        }
        await this.deleteWebhookUseCase.execute(this._webhookId);
    }

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
