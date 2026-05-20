import { computed, makeAutoObservable, runInAction } from "mobx";
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

class WebhookSettingsPresenterImpl implements IWebhookSettingsPresenter {
    private _loading = false;
    private _saving = false;
    private _form: IFormModel;

    public get vm(): IWebhookSettingsViewModel {
        return {
            loading: this._loading,
            saving: this._saving,
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
            }),
            layout: layout => [layout.row("signingSecret")]
        });
    }

    public async save() {
        const data = await this._form.submit<Record<string, unknown>>();
        if (data === false) {
            return false;
        }

        this._saving = true;

        try {
            const settings = await this.updateWebhookSettingsUseCase.execute({
                signingSecret: (data.signingSecret as string) || undefined
            });

            runInAction(() => {
                this._form.setData({
                    signingSecret: settings.signingSecret ?? ""
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

        try {
            const settings = await this.getWebhookSettingsUseCase.execute();

            runInAction(() => {
                this._form = this.buildForm();
                this._form.setData({
                    signingSecret: settings.signingSecret ?? ""
                });
                this._loading = false;
            });
        } catch {
            runInAction(() => {
                this._loading = false;
            });
        }
    }
}

export const WebhookSettingsPresenter = Abstraction.createImplementation({
    implementation: WebhookSettingsPresenterImpl,
    dependencies: [FormModelFactory, GetWebhookSettingsUseCase, UpdateWebhookSettingsUseCase]
});
