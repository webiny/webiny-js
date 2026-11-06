import { computed, makeAutoObservable, runInAction } from "mobx";
import { z } from "zod";
import {
    WebhookSettingsPresenter as Abstraction,
    type IWebhookSettingsPresenter,
    type IWebhookSettingsViewModel
} from "./abstractions.js";
import { GetWebhookSettingsUseCase } from "~/admin/features/getWebhookSettings/abstractions.js";
import { UpdateWebhookSettingsUseCase } from "~/admin/features/updateWebhookSettings/abstractions.js";
import {
    FormModelFactory,
    type IFormModel
} from "@webiny/app-admin/features/formModel/abstractions.js";
import { WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";
import {
    generateSigningSecret,
    INVALID_SIGNING_SECRET_MESSAGE,
    isValidSigningSecret
} from "~/admin/shared/signingSecret.js";

class WebhookSettingsPresenterImpl implements IWebhookSettingsPresenter {
    private _loading = false;
    private _saving = false;
    private _error: string | null = null;
    private _form: IFormModel;

    public get vm(): IWebhookSettingsViewModel {
        return {
            loading: this._loading,
            saving: this._saving,
            error: this._error,
            form: this._form.vm
        };
    }

    public constructor(
        private readonly formModelFactory: FormModelFactory.Interface,
        private readonly getWebhookSettingsUseCase: GetWebhookSettingsUseCase.Interface,
        private readonly updateWebhookSettingsUseCase: UpdateWebhookSettingsUseCase.Interface
    ) {
        this._form = this.buildForm();

        makeAutoObservable(this, { vm: computed });
    }

    private buildForm(): IFormModel {
        return this.formModelFactory.create({
            fields: fields => ({
                signingSecret: fields
                    .text()
                    .label("Signing Secret")
                    .placeholder("Enter a signing secret for webhook payloads")
                    .description(
                        "Used to sign webhook payloads so receivers can verify authenticity."
                    )
                    .schema(
                        z.string().optional().refine(isValidSigningSecret, {
                            message: INVALID_SIGNING_SECRET_MESSAGE
                        })
                    ),
                deliveryRetentionDays: fields
                    .number()
                    .label("Delivery Retention (days)")
                    .placeholder(String(WEBHOOK_DELIVERY_MAX_RETENTION_DAYS))
                    .description(
                        `How long to keep delivery logs. 0 = delete immediately. Max ${WEBHOOK_DELIVERY_MAX_RETENTION_DAYS} days.`
                    )
            }),
            layout: layout => [
                layout.row("signingSecret"),
                layout.element("signingSecretActions", {}),
                layout.row("deliveryRetentionDays")
            ]
        });
    }

    public generateSigningSecret(): void {
        this._form.field("signingSecret").setValue(generateSigningSecret());
    }

    public getSigningSecret(): string {
        return String(this._form.field("signingSecret").getValue() ?? "");
    }

    public async save(): Promise<boolean> {
        const data = await this._form.submit<Record<string, string>>();
        if (data === false) {
            return false;
        }

        runInAction(() => {
            this._saving = true;
        });

        try {
            const settings = await this.updateWebhookSettingsUseCase.execute({
                signingSecret: data.signingSecret || undefined,
                deliveryRetentionDays:
                    data.deliveryRetentionDays != null
                        ? Number(data.deliveryRetentionDays)
                        : undefined
            });

            runInAction(() => {
                this._form.setData({
                    signingSecret: settings.signingSecret ?? "",
                    deliveryRetentionDays: settings.deliveryRetentionDays ?? ""
                });
            });
        } finally {
            runInAction(() => {
                this._saving = false;
            });
        }
        return true;
    }

    public async init(): Promise<void> {
        this._loading = true;
        this._error = null;

        try {
            const settings = await this.getWebhookSettingsUseCase.execute();

            runInAction(() => {
                this._form = this.buildForm();
                this._form.setData({
                    signingSecret: settings.signingSecret ?? "",
                    deliveryRetentionDays: settings.deliveryRetentionDays ?? ""
                });
                this._loading = false;
            });
        } catch (error) {
            runInAction(() => {
                this._error =
                    error instanceof Error ? error.message : "Could not load webhook settings.";
                this._loading = false;
            });
        }
    }
}

export const WebhookSettingsPresenter = Abstraction.createImplementation({
    implementation: WebhookSettingsPresenterImpl,
    dependencies: [FormModelFactory, GetWebhookSettingsUseCase, UpdateWebhookSettingsUseCase]
});
