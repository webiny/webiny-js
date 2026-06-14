import { makeAutoObservable, runInAction, computed } from "mobx";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import { GetSettingsUseCase } from "~/features/getSettings/abstractions.js";
import { SaveSettingsUseCase } from "~/features/saveSettings/abstractions.js";
import {
    SettingsPresenter as Abstraction,
    type ISettingsPresenter,
    type ISettingsViewModel
} from "./abstractions.js";
import type { MailerSettingsSource, TransportSettings } from "~/types.js";

class SettingsPresenterImpl implements ISettingsPresenter {
    private loading = false;
    private saving = false;
    private source: MailerSettingsSource = null;
    private form: IFormModel;

    constructor(
        private getSettingsUseCase: GetSettingsUseCase.Interface,
        private saveSettingsUseCase: SaveSettingsUseCase.Interface,
        private formModelFactory: FormModelFactory.Interface
    ) {
        this.form = this.buildForm(null);
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): ISettingsViewModel {
        return {
            loading: this.loading,
            saving: this.saving,
            form: this.form.vm,
            source: this.source,
            editable: this.source !== "code"
        };
    }

    async load(): Promise<void> {
        runInAction(() => {
            this.loading = true;
        });

        try {
            const settings = await this.getSettingsUseCase.execute();

            runInAction(() => {
                this.source = settings.source ?? null;
                this.form = this.buildForm(this.source);
                this.form.setData({
                    host: settings.host,
                    port: settings.port,
                    user: settings.user,
                    from: settings.from,
                    replyTo: settings.replyTo
                });
            });
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    async save(): Promise<boolean> {
        const data = await this.form.submit();
        if (!data) {
            return false;
        }

        runInAction(() => {
            this.saving = true;
        });

        try {
            const payload: TransportSettings = {
                host: data.host as string,
                port: data.port as number | undefined,
                user: data.user as string,
                from: data.from as string,
                replyTo: data.replyTo as string | undefined
            };

            if (data.password) {
                payload.password = data.password as string;
            }

            await this.saveSettingsUseCase.execute(payload);
            return true;
        } finally {
            runInAction(() => {
                this.saving = false;
            });
        }
    }

    private buildForm(source: MailerSettingsSource): IFormModel {
        const isCodeManaged = source === "code";

        return this.formModelFactory.create({
            fields: fields => {
                const result: Record<string, any> = {
                    host: fields
                        .text()
                        .label("Hostname")
                        .required("Hostname is required.")
                        .disabled(isCodeManaged),
                    port: fields.number().label("Port").disabled(isCodeManaged),
                    user: fields
                        .text()
                        .label("User")
                        .required("User is required.")
                        .disabled(isCodeManaged),
                    from: fields
                        .text()
                        .label("Mail from")
                        .required("Mail from is required.")
                        .disabled(isCodeManaged),
                    replyTo: fields.text().label("Mail reply-to").disabled(isCodeManaged)
                };

                if (!isCodeManaged) {
                    result.password = fields.password().label("Password");
                }

                return result;
            },
            layout: layout => {
                const rows = [layout.row("host"), layout.row("port"), layout.row("user")];

                if (!isCodeManaged) {
                    rows.push(layout.row("password"));
                }

                rows.push(layout.row("from"), layout.row("replyTo"));

                return rows;
            }
        });
    }
}

export const SettingsPresenterImplementation = Abstraction.createImplementation({
    implementation: SettingsPresenterImpl,
    dependencies: [GetSettingsUseCase, SaveSettingsUseCase, FormModelFactory]
});
